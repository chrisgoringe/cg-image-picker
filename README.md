# Image Chooser

Nodes to allow you to preview images and choose one to pass on to the rest of your workflow. Suggested in response to [love_leaves_marks](https://www.reddit.com/user/Love_Leaves_Marks/) on reddit.

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

## To use - Image Chooser

Here's a really simple example. The `Preview for Image Chooser` node is just a `Preview Image` node with an added output that passes the images on - that's just for convenience. When you run the prompt, it will pause on the `Image Chooser` until you press 'go', at which point it will pass the selected image on.

![workflow](docs/Screenshot.png)

This dog has that workflow saved for you to drop onto ComfyUI:

![dog](docs/dog.png)

Or just download the [workflow](docs/workflow.json)

## No, you can't change other widgets while it's waiting

It's tempting to think you could edit other widgets downstream before pressing 'go' (maybe you look at an image, and then decide what denoise factor to use downstream). 

But the way ComfyUI works is that all the widget values get sent to the server at the start - so changes you make during a pause aren't applied to that run.

The exception is the chooser nodes themselves. They communicate directly with the server when you press 'go'. So their values when you started the run (which were sent to the server) are ignored in favour of the ones sent when you pressed 'go' to continue the workflow. 

## Trigger?

The trigger input is optional, can take any input, and is ignored. You use it to ensure that an upstream node runs before this one. So if you are choosin

## Send a second choice?

A few people have asked if it is possible to send one output, and then another. No, it's one 'go' per run.

The way I suggest you work is have everything upstream with fixed seeds, so when you run the workflow again none of it gets repeated, then you can make a different choice.

I'm going to look into allowing more than one selection to be passed through, [as suggested here](https://github.com/chrisgoringe/cg-image-picker/issues/1) but no promises.

(update - see below)

## Latent Chooser

If you want the rest of your workflow to start with the latent instead, use the `Latent Chooser` 

![workflow](docs/Screenshot%20latent.png)

Here's another dog with the workflow... ![dog](docs/latent%20choice.png)

## Multiple outputs

This is a WIP - in `utilites/control/_testing` there is `Multi Latent Chooser`. This is designed to work with [Fabric](https://github.com/ssitu/ComfyUI_fabric), but you might find other uses.

![multi](docs/multi.png)

It takes a *batch* of latents, and you can enter two comma separated lists of choices - 'positive' and 'negative'. The outputs are each a batch of latents just containing the ones you selected. If either list is empty, a single zero latent of the input shape is output (to avoid errors downstream).

If you select the mode `Accumulate` then the positive and negative selections from the last run will also be included - so you can accumulate latents that are good or bad over multiple runs. The text at the bottom shows how many latents have been sent on each output.

You'll probably want to use the trigger so you can check the images... like this:

![trigger](docs/trigger.png)

Oh, and if you are wondering how the VAE Decode is working with no VAE, you should check out [UE Nodes](https://github.com/chrisgoringe/cg-use-everywhere) to get your link spaghetti under control.

## Issues? Comments? Delight?

Raise an issue. Or give this repository a star.
