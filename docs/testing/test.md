# Testing....

Here are two workflows you can download to test the new 'restart from here' feature.
[image](./image%20workflow.json) or [latent](./latent%20workflow.json)

## Basic use - 

- run the workflow
- right-click an image in the preview and 'Progress this image'
- when it's done, right-click another and 'Progress this image (as restart)'

## dapting the workflows... some pointers...

- Always have a chooser node directly after the preview
- If using latent chooser, always connect both images and latents through the preview
- Note that the workflow saved with an image done by restart only includes a subset of nodes!

## Understanding it

- The chooser stashes the input it gets, so it can reuse it if it has no input the next time
- When you 'restart', the chooser node submits a copy of the workflow *removing everything that isn't needed*
- What is needed? I call it the V - any node you can reach by going downstream, then back upstream
- Check the JS console for a list of nodes identified as needed

## WIP!

This code might change quite often. Feedback really useful!