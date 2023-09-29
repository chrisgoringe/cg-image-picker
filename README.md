# Image Chooser

Nodes to allow you to preview images and choose one to pass on to the rest of your workflow. Suggested in response to [love_leaves_marks](https://www.reddit.com/user/Love_Leaves_Marks/) on reddit.

Want to make your workflow cleaner - check out [UE Nodes](https://github.com/chrisgoringe/cg-use-everywhere). And leave a star if you like something!

## To install
```
cd [path to ComfyUI]/custom_nodes
git clone https://github.com/chrisgoringe/cg-image-picker.git
```

## To update
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

## id

The node has an id which randomly changes every time you use it - hopefully this means that you can use the node on multiple workflows or multiple times on the same workflow without them interfering. Raise an issue if this doesn't work. Going to see if I can work out how to hide it.

The id must be a widget. Don't make it an input. Don't know why you would want to, but don't.

## Send a second choice?

A few people have asked if it is possible to send one output, and then another. No, it's one 'go' per run.

The way I suggest you work is have everything upstream with fixed seeds, so when you run the workflow again none of it gets repeated, then you can make a different choice.

I'm going to look into allowing more than one selection to be passed through, [as suggested here](https://github.com/chrisgoringe/cg-image-picker/issues/1) but no promises.

## Latent Chooser

If you want the rest of your workflow to start with the latent instead, use the `Latent Chooser` 

![workflow](docs/Screenshot%20latent.png)

Here's another dog with the workflow... ![dog](docs/latent%20choice.png)

## Issues? Comments? Delight?

Raise an issue. Or give this repository a star.
