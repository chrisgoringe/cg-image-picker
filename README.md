# Image Chooser

A pair of nodes to allow you to preview images and choose one to pass on to the rest of your workflow. Suggested in response to [love_leaves_marks](https://www.reddit.com/user/Love_Leaves_Marks/) on reddit.

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

## To use

Here's a really simple example. The `Preview for Image Chooser` node is just a `Preview Image` node with an added output that passes the images on - that's just for convenience. When you run the prompt, it will pause on the `Image Chooser` until you press 'go', at which point it will pass the selected image on.

![workflow](docs/Screenshot.png)

This dog has that workflow saved for you to drop onto ComfyUI:

![dog](docs/dog.png)

Or just download the [workflow](docs/workflow.json)

## Issues? Comments? Delight?

Raise an issue. Or give this repository a star.