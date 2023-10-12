# Image Chooser

A node to allow you to preview images and choose one or more to pass on to the rest of your workflow (as image or latent). 

(shameless plug for my other work - want to make your workflow cleaner - check out [UE Nodes](https://github.com/chrisgoringe/cg-use-everywhere). And leave a star if you like something!)

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

# Update 2.5 

Most of the old nodes have gone away, replaced with a single node that combines image preview with single- or multi-pick chooser, 'restart from here', and the HUD.

This dog has a basic workflow, using only regular nodes and the Unified Chooser. If you're going to try the node out, please start with this - if it doesn't work, nothing more complicated will! And it's much easier to narrow down problems on a simple workflow!
![dog](docs/dog.png)

## Notes...

This is part of that workflow
![workflow](docs/Screenshot.png)

There is just one node now, the `Preview Chooser`. It has one widget control, mode - this just determines how the node behaves when there is only a single image.

When the workflow pauses in the `Preview Chooser`, you can right-click on the images to select / unselect them - selected images are marked with a green box. When there are one or more images selected, you can `Progress selected images` to send them out. You can also cancel the run from the right-click menu.

Once the run finishes you can `Progress... (as restart)` to send one or more images on from the node (which has 'stashed' them).

You should always have the image input connected; if you have the latent input connected, the same latents are output as images (in the same order - which is actually the order in which you selected them). I *very strongly* suggest that you always pass the latents through the `Preview Chooser` - the order of node execution, and the ability to restart, are much more reliable if you do.

As you can see from the workflow, it is possible now to have multiple choosers, and to mix and match image and latent choosers.


## No, you can't change other widgets while it's waiting (but you can restart)

It's tempting to think you could edit other widgets downstream before pressing 'go' (maybe you look at an image, and then decide what denoise factor to use downstream). 

But the way ComfyUI works is that all the widget values get sent to the server at the start - so changes you make during a pause aren't applied to that run.

The exception is the chooser nodes themselves. They communicate directly with the server when you press 'go'. So their values when you started the run (which were sent to the server) are ignored in favour of the ones sent when you pressed 'go' to continue the workflow. 

But you *can* change widgets and then do a `Progress... (as restart)`



## WIP - if you rely on it then I suggest you go back to 

This is a WIP - in `utilites/control/_testing` there is `Multi Latent Chooser`. This is designed to work with [Fabric](https://github.com/ssitu/ComfyUI_fabric), but you might find other uses.

![multi](docs/multi.png)

It takes a *batch* of latents, and you can enter two comma separated lists of choices - 'positive' and 'negative'. The outputs are each a batch of latents just containing the ones you selected. If either list is empty, a single zero latent of the input shape is output (to avoid errors downstream).

If you select the mode `Accumulate` then the positive and negative selections from the last run will also be included - so you can accumulate latents that are good or bad over multiple runs. The text at the bottom shows how many latents have been sent on each output.

*This may be broken at the moment* - if so, and if you are using it, please revert to commit 9505f3ce99b40375121eeaaccf43f1153a032304:

```
cd cg-image-picker
git checkout 9505f3ce99b40375121eeaaccf43f1153a032304
```

## Issues? Comments? Delight?

Raise an issue. Or give this repository a star.
