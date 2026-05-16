# AprilTag Image Generation

This project uses AprilTags to track the four corners of the physical book.

Use the `tag36h11` AprilTag family and generate these four IDs:

```text
ID 0 = top-left corner
ID 1 = top-right corner
ID 2 = bottom-right corner
ID 3 = bottom-left corner
```

Place them on the book like this:

```text
ID 0 ---------------- ID 1


          book


ID 3 ---------------- ID 2
```

## Option 1: Use An Online Generator

Search for:

```text
AprilTag generator tag36h11
```

In the generator, choose:

```text
Family: tag36h11
IDs: 0, 1, 2, 3
Format: PNG or PDF
```

Print each tag at the same size. A good first test size is about `3 cm x 3 cm`.

## Option 2: Use Ready-Made Tag Images

You can download ready-made `tag36h11` AprilTag images from an AprilTag generator or AprilTag repository, then print only IDs `0`, `1`, `2`, and `3`.

Make sure the file names or labels clearly show the ID number before printing.

## Printing Tips

- Keep the full black-and-white square visible.
- Do not crop the white border around the tag.
- Use matte paper if possible.
- Make all four tags the same physical size.
- Keep the tags flat on the same plane as the book page.
- Bigger tags are easier for the camera to detect.

## Testing In The App

Start the app and activate the camera.

When the camera detects tags, the app draws a green outline and label over each detected tag.

The status changes from:

```text
Looking for AprilTags 0-3
```

to:

```text
AprilTags found
```

Only when all four IDs are visible can the app compute the page homography.
