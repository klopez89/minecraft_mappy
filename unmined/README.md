
## Usage

    unmined-cli <module> <verb> [options]

Available modules: image, web

Show module verbs:
    
    unmined-cli <module> help

Show verb options:

    unmined-cli <module> help <verb>

## Examples

Show available options for verb "render" in module "image":

    unmined-cli image help render

Render a single image file at zoom level -3 (1 pixel = 2^3 = 8 blocks):

    unmined-cli image render --zoom=-3 --trim --world="%APPDATA%\.minecraft\saves\My World" --output="%USERPROFILE%\Desktop\MyMap.png"

Render a web map:

    unmined-cli web render --world="%APPDATA%\.minecraft\saves\My World" --output="%USERPROFILE%\Desktop\MyMap"


## Parameters

### --area

Syntax of the --area parameter:

Selecting a rectangle using x,z coordinates and width/height:

    --area=r(x,z,width,height)
    --area=c(x,z,width,height)
    --area=b(x,z,width,height)

Selecting a rectangle using x1,z1 and x2,z2 coordinates:

    --area=r((x1,z1),(x2,z2))
    --area=c((x1,z1),(x2,z2))
    --area=b((x1,z1),(x2,z2))

Meaning of the first character:

* r = region coordinates
* c = chunk coordinates
* b = block coordinates

Coordinate math:

* (x1,z1) and (x2,z2) points are inclusive (inside the rectangle)
* width = x2 - x1
* height = z2 - z1
* 1 chunk = 16 blocks
* 1 region = 32 chunks = 512 blocks

#### Examples:


Select 100x50 blocks area at x=2000, z=2000:

    --area=b(2000,2000,100,50)
    --area=b((2000,2000),(2101,2051))

Select one region at x=2, z=2 (r.2.2.mca):

    --area=r(2,2,1,1)
    --area=c(64,64,32,32)
    --area=b(1024,1024,512,512)

    --area=r((2,2),(3,3))
    --area=c((64,64),(97,97))
    --area=b((1024,1024),(1537,1537))
