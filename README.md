# Image Chooser

Nodes to allow you to preview images and choose one to pass on to the rest of your workflow. Suggested in response to [love_leaves_marks](https://www.reddit.com/user/Love_Leaves_Marks/) on reddit.

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

## Latent Chooser

If you want the rest of your workflow to start with the latent instead, use the `Latent Chooser` 

![workflow](docs/Screenshot%20latent.png)

Here's another dog with the workflow... ![dog](docs/latent%20choice.png)

## Issues? Comments? Delight?

Raise an issue. Or give this repository a star.