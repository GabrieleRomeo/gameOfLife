The Game Of Life
=====================

[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()



This repository contains a representation of the *game of life* automata built using **vanilla ES6 Javascript** for the *Object-Oriented Programming* course at the [BOV academy](https://www.bovacademy.com).

The project relies on the *HTML5 Canvas* element for the aesthetics and *Web Workers* to do the onerous task of computing cellulars' status.



The base namespace used to define the references to the elements involved into the process is `gofl`



The main class constructor accepts an HTMLCanvasElement and an optional config file with the following properties:

* `randomColors` -  (default false)  - If true it sets random colors to each new pixel
* `randomPixels` -  (default 1000)  - Defines the value of the initial random pixels
* A `canvas` object with the following properties:
  * `width` - (default 800 pixels) - The final width of the main canvas
  * `height` - (default 500 pixels) - The final height of the main canvas
  * `fullScreen` - (default false) - If true it makes the canvas' size to the entire *viewport*
  * `showGrid` -  (default true)  - If true it draws a grid
  * `showGridAtStartup` -  (default true) - If true it draws a grid at startup
  * `showFps` -  (default false)  - If true it shows a tooltip containing the current Frames per Second rate
* A `pixel` object with the following properties:
  * `width` -  (default 10) - The pixel's width
  * `height` - (default 10) - The pixel's height
  * `bgcolor` -  (default #000)  - A string representing a RGB color for pixels
* A `timeFrame` object with the following properties:
  * `record` - (default false) - If true it records each frame during execution
  * `show`- (default false) - If true it shows the timeFrame
  * `$element` - (default an element with ID `gofl__timeFrame` )
  * `useSnapshot` - (default false) - If true the system will take snapshots
* A `snapshots` object with the following properties:
  * `scale` - (default 0.3) - A value between 0.1 and 1 which defines a scale factor for the snapshots
  * `quality` - (default 0.5) - A value between 0.1 and 1 which defines the snapshots' quality
* A `splash` object with the following properties:
  * `showSplash` - (default true) - If true the system shows a splash intro
  * `text` - (default `The Game of Life`) - A string for the splash intro
  * `fontFamily` - (default `"Holtwood One SC", Futura, Helvetica, sans-serif`)
  * `fontSize` - (default `70`)
  * `isUpperCase` - (default `true`) - If true it makes the text upperCase
  * `useMusicEffect` - (default `true`) - If true it reproduces a music effect at startup
* A `musicEffect` object with the following properties:
  * `path` - (default `public/light-bulb.wav`) - The path of a music file
  * `volume` - (default `0.3`) - Set the audio's volume. Use a number between the range [0.1 - 1] where `0.1` indicates `10%` of the volume and `1` indicates `100%`.


----------------


Click the following link to see a [Demo](https://gabrieleromeo.github.io/gameOfLife/) 

----------------


Copyright 2017 © Gabriele Romeo

> ```
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
> ```


