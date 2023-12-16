# Termsprite (2023/12/15-2023/12/16)
## About
To get back into rust programming, and for practice for future projects, I wanted to write a simple terminal application which took an image file as an input and outputted the contents to the terminal. The practical use for something like this is very limited, so just take this week's project a simple little tool as a warmup for more project to come. 

Because of the simplicity, I think it's alright to just jump right into the development section. I'm not a rust developer per se, I got started with development in Java and Javascript before learning Python, so something like Rust is actually pretty new for me. For this reason, you may see me make beginner mistakes. I wouldn't take this post (or any of my posts, for that matter) as a "tutorial", but more a stream of consciousness during a programming session.

I primarily learn by *doing* and during this process it's common for me to mess up horribly.

## Development
I started with a simple hello world program.

```rust
fn main() {
    print!("Hello, World!");
}
```

This ran fine so I moved onto thinking about what my program was going to need.

### Requirements planning
Really the basic version of the application will follow this simple process:
1. Parse command line arguments for file
2. Open a file
3. Read the file contents (parse as an image - keeping in mind the pixel's position)
4. Loop through contents and print each set of pixels as the unicode half block character with the appropriate foreground and background colours.

So I needed to write parts of the application with these in mind. 

### Parsing command line arguments
The entire point of this part was to grab the path to the file. For this I used `std::env` and performed a basic check for the amount of args.

```rust
fn main() {
    // Parsing command line arguments
    let args: Vec<String> = env::args().collect();

    if args.len() == 1 {                             // No args provided
        print!("Invalid args\n");
        print!("USAGE: termsprite <path> OPTIONS...\n");
        print!("    OPTIONS:\n");
        print!("        \n");
        return;
    }

    let path = &args[1];
    let options = &args[2..]; // ADDME
    
    print!("{}", format!("Path: {}\nOptions: {:?}", path, options));
}
```

When I ran `cargo run` I got
```
Invalid args
USAGE: termsprite <path> OPTIONS...
    OPTIONS:

```

When I ran `cargo run path` I got
```
Path: path
Options: []
```

When I ran `cargo run path arg arg` I got
```
Path: path
Options: ["arg", "arg"]
```

### File Input
This function takes a path as an input and returns a 2d array (vector) of pixel data.

To process the files I will be using the [image crate](https://docs.rs/image/latest/image/).

Writing the open file function was quite a challenge actually, I used multiple implementations over the course of a few hours (while also going through many different ideas - such as going from handling data myself to using the image crate). In the end the code isn't the cleanest and I want to mop it up at some point.

Let's begin with some basic context. I made a `Pixel` struct which will store the raw pixel data:
```rust
#[derive(Debug)]
struct Pixel {
    r: u8,
    g: u8,
    b: u8,
    a: u8,
}

impl Default for Pixel {
    fn default() -> Self {
        Pixel {
            r: 0,
            g: 0,
            b: 0,
            a: 0
        }
    }
}
```

In hindsight, this was unnecessary. I could have used the reader's output just fine. This way is just a little cleaner later on.

With this struct in mind, we can now move onto opening the file.

I start by using the `image::io::Reader` to open the file and decode it.

```rust
fn open_file(path: &Path) -> Result<Vec<Vec<Pixel>>, ImageError> {
    // Open image
    let img = ImageReader::open(path)?.decode()?;
    ...
```

Then I take the decoded contents of this and iterate over the pixels. For each pixel I check two things. If the `y` position of the pixel is equal to the length of the y axis in the 2d vector. And, if the `x` position of the pixel is equal to the length of the x axis. In both cases, if they return true I will push contents to the array.

In the case of `y`, I push an empty `vec![]`, as it means we need a new line to begin a new set of pixels.

In the case of `x`, I push a new `Pixel`, as it means we need a new pixel in that x position.

If both return false then that means that a duplicate position has been found, and will be ignored. To my knowledge, no image format has duplicate positions.

```rust
...
    for pixel in img.pixels() {
        let x: usize = pixel.0 as usize;
        let y: usize = pixel.1 as usize;
        let r = pixel.2[0];
        let g = pixel.2[1];
        let b = pixel.2[2];
        let a = pixel.2[3];

        if pixel_vec.len() == y {
            pixel_vec.push(vec![]);
        }

        if pixel_vec[y].len() == x {
            pixel_vec[y].push(Pixel {r,g,b,a});
        }
    }
...
```

Running `dbg!()` on this produced this output:
```
        ...
        Pixel {
            r: 255,
            g: 0,
            b: 242,
            a: 255,
        },
        Pixel {
            r: 255,
            g: 255,
            b: 255,
            a: 255,
        },
        Pixel {
            r: 255,
            g: 0,
            b: 242,
            a: 255,
        },
```

This produced data that is usable.

### Outputting contents
This is when the project finally becomes more visual!

I'm using [crossterm](https://github.com/crossterm-rs/crossterm) to provide terminal functionality. I could've used escape codes myself (I have implemented something similar in Python before), but I felt it was overkill for a warmup project.

I started by writing the simple output command. It takes a `Pixel` and outputs it.

```rust
fn output(pixel: &Pixel) -> std::io::Result<()> {
    execute!(
        stdout(),
        SetForegroundColor(Color::Rgb {r: pixel.r, g: pixel.g, b: pixel.b}),
        SetBackgroundColor(Color::Rgb {r: pixel.r, g: pixel.g, b: pixel.b}),
        Print("█"),
        ResetColor
    )?;

    Ok(())
}
```

Then I wrote a simple loop to go through the contents in `main()`.

```rust
fn main() {
    ...
    for y in &content {
        for x in y {
            output(x);
        }

        execute!(
            stdout(),
            Print("\n")
        ).unwrap();
    }
    ...
```

![スクリーンショット 2023-12-16 015546.png](./スクリーンショット%202023-12-16%20015546.png)

This outputs an image, however it is stretched due to the inherent height that characters have. The way to solve this is to actually iterate over the y axis with a step - so that you tackle 2 rows at a time. Then you use half block characters and treat the background and foreground as separate pixels.

```rust
fn output(upper_pixel: &Pixel, lower_pixel: &Pixel) -> std::io::Result<()> {
    execute!(
        stdout(),
        SetForegroundColor(Color::Rgb {r: upper_pixel.r, g: upper_pixel.g, b: upper_pixel.b}),
        SetBackgroundColor(Color::Rgb {r: lower_pixel.r, g: lower_pixel.g, b: lower_pixel.b}),
        Print("▀"),
        ResetColor
    )?;

    Ok(())
}
```

```rust
fn main() {
    ...
    for y in (1..content.len()).step_by(2) {
        for x in (0..content[y].len()) {
            output(&content[y-1][x], &content[y][x]);
        }

        execute!(
            stdout(),
            Print("\n")
        ).unwrap();
    }
    ...
```

![スクリーンショット 2023-12-16 020529.png](./スクリーンショット%202023-12-16%20020529.png)

Using the upper half block made the output look a little skewed, so I resorted to the lower half block which seems to be more balanced in my terminal.

![スクリーンショット 2023-12-16 020728.png](./スクリーンショット%202023-12-16%20020728.png)

I tested it again with a pokemon sprite.

![スクリーンショット 2023-12-16 021629.png](./スクリーンショット%202023-12-16%20021629.png)

### Cleaning up the code and adding error handling
Up to this point I had been using quite a lot of unwraps. So I replaced these with proper error handling.

In both cases I just replaced the `.unwrap()` with a proper `match` statement which correctly handled the errors.

### Adding "legacy mode"
Some terminals don't support the RGB format that I forced the pixels into. So, to combat this I decided to add a `-l` flag which would then find the closest matching colour to the pixel.

For this I changed the `output` function slightly. It takes a `legacy` argument (boolean value) and calculates the foreground and background differently based on the state of that flag.

```rust
fn output(upper_pixel: &Pixel, lower_pixel: &Pixel, legacy: bool) -> std::io::Result<()> {
    let foreground: Color;
    let background: Color;

    if legacy {
        foreground = calculate_legacy_color(lower_pixel.r, lower_pixel.g, lower_pixel.b);
        background = calculate_legacy_color(upper_pixel.r, upper_pixel.g, upper_pixel.b);
    } else {
        foreground = Color::Rgb {r: lower_pixel.r, g: lower_pixel.g, b: lower_pixel.b};
        background = Color::Rgb {r: upper_pixel.r, g: upper_pixel.g, b: upper_pixel.b};
    }

    execute!(
        stdout(),
        SetBackgroundColor(background),
        SetForegroundColor(foreground),
        Print("▄"),
        ResetColor
    )?;

    Ok(())
}
```

This invokes a different method if true, `calculate_legacy_color`. This method takes the rgb values and just outputs a crossterm Color that closely matches this value.

However, calculating this value is no small task. Originally I was going to check if the rgb values were in particular ranges. But there are so many possible color combinations - and what "closely matches" one particular color is quite subjective. I'm not an artist.

I resorted to using the [internet](https://stackoverflow.com/questions/61845050/changing-the-pixels-of-an-image-to-the-closest-color-from-a-given-set-of-colors) to see how people typically solve these kinds of issues.

The general gist is to use a function which gives a different "cost" to each possible color. If that cost is lower than some "lowest cost" then it will pick that as a the color. The function provided in the link wasn't perfect (and my initial implementation was even worse). 

```rust
fn calculate_legacy_color(r: u8, g: u8, b: u8) -> Color {
    let color_set_rgb: Vec<Pixel> = vec![
        Pixel {r: 0,   g: 0,   b: 0,   a: 255, legacy_col: Color::Red},         // Black
        Pixel {r: 128, g: 128, b: 128, a: 255, legacy_col: Color::DarkGrey},    // DarkGrey
        Pixel {r: 255, g: 0,   b: 0,   a: 255, legacy_col: Color::Red},         // Red
        Pixel {r: 128, g: 0,   b: 0,   a: 255, legacy_col: Color::DarkRed},     // DarkRed
        Pixel {r: 0,   g: 255, b: 0,   a: 255, legacy_col: Color::Green},       // Green
        Pixel {r: 0,   g: 128, b: 0,   a: 255, legacy_col: Color::DarkGreen},   // DarkGreen
        Pixel {r: 255, g: 255, b: 0,   a: 255, legacy_col: Color::Yellow},      // Yellow
        Pixel {r: 128, g: 128, b: 0,   a: 255, legacy_col: Color::DarkYellow},  // DarkYellow
        Pixel {r: 0,   g: 0,   b: 255, a: 255, legacy_col: Color::Blue},        // Blue
        Pixel {r: 0,   g: 0,   b: 128, a: 255, legacy_col: Color::DarkBlue},    // DarkBlue
        Pixel {r: 255, g: 0,   b: 255, a: 255, legacy_col: Color::Magenta},     // Magenta
        Pixel {r: 128, g: 0,   b: 128, a: 255, legacy_col: Color::DarkMagenta}, // DarkMagenta
        Pixel {r: 0,   g: 255, b: 255, a: 255, legacy_col: Color::Cyan},        // Cyan
        Pixel {r: 0,   g: 128, b: 128, a: 255, legacy_col: Color::DarkCyan},    // DarkCyan
        Pixel {r: 255, g: 255, b: 255, a: 255, legacy_col: Color::White},       // White
        Pixel {r: 50,  g: 50,  b: 50,  a: 255, legacy_col: Color::Grey},        // Grey
    ];

    let pixel_sum: u64 = (r as u64) + (g as u64) + (b as u64);
    let mut low_cost: f64 = 10000.0;
    let mut cost: f64 = 0.0;
    let mut col: Color = Color::Red;

    for color in color_set_rgb {
        let color_sum: u64 = (color.r as u64) + (color.g as u64) + (color.b as u64);
        cost = (color_sum as f64 - pixel_sum as f64);
        cost = cost.powf(2.0);

        //println!("{}", cost);

        if cost < low_cost {
            low_cost = cost;
            col = color.legacy_col;
        }
    }

    return col;

}
```

This provided a strange output:

![スクリーンショット 2023-12-16 114521.png](./スクリーンショット%202023-12-16%20114521.png)

When I tried it with Pikachu instead, it looked passable:

![スクリーンショット 2023-12-16 115642.png](./スクリーンショット%202023-12-16%20115642.png)

This is an area of improvement in the future.

### Cleanup and final thoughts
That was the end of development of this project. I could print sprites to the terminal and also have a function that could (very roughly) approximate colours for older terminals. I think overall this project was a pretty nice warmup to rust. 

Much like my timeboxing project, I think I would have to go over the source code with someone who *knows* Rust - just so that I can get opinions on my code and the best practices to use.

If I do end up doing this then I will most likely make a follow up post.

I also thought about using more advanced crossterm functions to play gifs. Looking at the image crate docks, it wouldn't actually be that hard to add gif support. Perhaps if I get bored one day I might add this feature.

That's all I have for this week, thanks for reading!


### P.S.
I almost forgot to mention one of the defining "features" of the development process. I decided to use only base neovim with no extensions. I want to rely less on IDE features to program. This did make some parts of the program an absolutely nightmare to write but overall it was actually pretty fun doing this.