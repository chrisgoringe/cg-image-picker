# Image Chooser

A node to allow you to preview images and choose one or more to pass on to the rest of your workflow (as image or latent). 

(shameless plug for my other work - want to make your workflow cleaner - check out [UE Nodes](https://github.com/chrisgoringe/cg-use-everywhere). And leave a star if you like something!)

## Basic usage

|Here's part of a simple workflow|It's saved in this image|
|-|-|
|![workflow](docs/Screenshot.png)|![dog](docs/dog.png)

This uses only regular nodes and the Unified Chooser. If you're going to try the node out, please start with this - if it doesn't work, nothing more complicated will! And it's much easier to narrow down problems on a simple workflow!

|Here's a workflow that illustrates use with both images and latents|Saved in this dog|
|-|-|
|![workflow](docs/Screenshot%20both.png)|![dog](docs/both.png)

## Recent changes

2.5.1 - 2.5.3 (13-14 Oct 2023)
- added a cancel button
- fixed the cancel in the main menu
- removed some possible causes of incompatibility with other custom nodes.
- click on images to select them
- eliminate the right-click menu

2.5 (13 Oct 2023)
- Major update to unify the chooser and preview nodes

## Notes...

When the workflow pauses in the `Preview Chooser`, you click on the images to select / unselect them - selected images are marked with a green box. When there are one or more images selected, you can `Progress selected images` to send them out. You can cancel the run from the right-click menu on the background canvas.

Once the run finishes you can `Progress... (as restart)` to send one or more images on from the node (which has 'stashed' them).

You should always have the image input connected; if you have the latent input connected, the same latents are output as images (in the same order - which is actually the order in which you selected them). I *very strongly* suggest that you always pass the latents through the `Preview Chooser` - the order of node execution, and the ability to restart, are much more reliable if you do.

As you can see from the workflow, it is possible now to have multiple choosers, and to mix and match image and latent choosers.

## No, you can't change other widgets while it's waiting (but you can restart)

It's tempting to think you could edit other widgets downstream before pressing 'go' (maybe you look at an image, and then decide what denoise factor to use downstream). 

But the way ComfyUI works is that all the widget values get sent to the server at the start - so changes you make during a pause aren't applied to that run.

The exception is the chooser nodes themselves. They communicate directly with the server when you press 'go'. So their values when you started the run (which were sent to the server) are ignored in favour of the ones sent when you pressed 'go' to continue the workflow. 

But you *can* change widgets and then do a `Progress... (as restart)`

## To install

Find it in Comfy Manager. Or:

```
cd [path to ComfyUI]/custom_nodes
git clone https://github.com/chrisgoringe/cg-image-picker.git
```

## To update

Comfy Manager. Or:

```
cd [path to ComfyUI]/custom_nodes/cg-image-picker
git pull
```

## Fabric node?

The node built for Fabric (which produces +ve and -ve outputs) is currently on hold (it will come back soon!) - if you really need it, please revert to commit 9505f3ce99b40375121eeaaccf43f1153a032304. The version in this build *might* work but is entirely untested.

```
cd cg-image-picker
git checkout 9505f3ce99b40375121eeaaccf43f1153a032304
```

## Issues? Comments? Delight?

Raise an issue. Or give this repository a star.
