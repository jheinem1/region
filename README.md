# region

A simple promise-based roblox-ts API that detects when parts enter defined regions.

## But Why?

This package was adapted from the codebase of a few games I'd worked on. I had originally created this out of a need to heavily optimize region-based events across the client and server. Although it never got to realize its full potential, the improvements over previous methods was significant enough that I decided to spin this off into a separate API.

Most region APIs rely on events, which generally involve a lot of busy waiting in the background. This API relies on promises- and only runs when you need it to. Additionally, promises make it easy to deal with multiple method calls, even without provided wrappers such as `RegionUnion` or `RegionNegation`. All that combined with a highly efficient codebase makes for code that is both performant and extensible.

## Usage

`Region` objects all inherit the same abstract class, making it easy to negate and union them.

### Region

`Region` is an abstract class, but it's inherited by all classes in the API.

#### Region.enteredRegion

```TypeScript
enteredRegion(part: BasePart, timeout?: number, step?: () => Promise<unknown>): Promise<void>
```
Returns a promise that resolves when the provided part enters the region.

`step` is an optional argument (that normally defaults to `task.wait(0.1)` for most `Region` classes) which can be used to provide a function that yields for a certain amount of time. This can be useful for tying checks to a specific event.

#### Region.leftRegion

```TypeScript
leftRegion(part: BasePart, timeout?: number, step?: () => Promise<unknown>): Promise<void>
```
Returns a promise that resolves when the provided part leaves the region.

`step` is an optional argument (that normally defaults to `task.wait(0.1)` for most `Region` classes) which can be used to provide a function that yields for a certain amount of time. This can be useful for tying checks to a specific event.

#### Region.isInRegion

```TypeScript
isInRegion(point: Vector3): boolean
```
Returns true if the point is in the `Region`, false if not.

### BasePartRegion

The most basic of these is the `BasePartRegion` which can either be created using the properties or an existing `BasePart`.
```TypeScript
const regionPart = new Instance("Part");
regionPart.Position = new Vector3(0, 0, 0);
regionPart.Size = new Vector3(10, 20, 10);
regionPart.Shape = Enum.PartType.Cylinder;

const region = Region.fromPart(regionPart)
```
Alternatively, `BasePartRegion`s can be created using the position CFrame, size, and shape of the desired region.
```TypeScript
const region = new Region(new CFrame(0, 0, 0), new Vector3(10, 10, 10), Enum.PartType.Cylinder);
```

#### constructor

```TypeScript
constructor(
  location: CFrame,
  size: Vector3,
  shape: Enum.PartType,
)
```

#### BasePartRegion.fromPart

```TypeScript
fromPart(part: BasePart): BasePartRegion
```
An alternative to the constructor, this allows for the creation of `BasePartRegion`s using `BasePart`s.

### RegionUnion

`RegionUnion`s are a great way to combine regions, though you can technically do it yourself with a little `Promise.race`. The main reason for using `RegionUnion`s though, is that they're compible with both other `RegionUnion`s and `RegionNegation`s.

`RegionUnion` has all the same methods as `BasePartRegion`, it just combines the functionality of multiple `BasePartRegion`s.
```TypeScript
const regionPart0 = new Instance("Part");
regionPart0.Position = new Vector3(0, 0, 0);
regionPart0.Size = new Vector3(10, 20, 10);
regionPart0.Color = new Color3(0, 1, 0);
regionPart0.Shape = Enum.PartType.Cylinder;

const regionPart1 = new Instance("Part");
regionPart1.Position = new Vector3(0, 0, 0);
regionPart1.Size = new Vector3(10, 10, 10);
regionPart1.Color = new Color3(1, 0, 0);
regionPart1.Shape = Enum.PartType.Ball;

const region = new RegionUnion([BasePartRegion.fromPart(regionPart0), BasePartRegion.fromPart(regionPart1)]);
```

#### constructor

```TypeScript
constructor(regions: Region[])
```

#### RegionUnion.getRegions

```TypeScript
getRegions(point: Vector3): Region[]
```
Returns an array of regions (if any) a point is in.

### RegionNegation

Like `RegionUnion`, `RegionNegation` takes multiple regions and combines them into a single region with the same methods as the `BasePartRegion`. The main difference is that the constructor takes a `Region` (can be any of the classes) and another `Region` to negate from that. Basically just like unions in Roblox, this allows for the formation of complex shapes.

```TypeScript
const regionPart = new Instance("Part");
regionPart.Position = new Vector3(0, 0, 0);
regionPart.Size = new Vector3(10, 20, 10);
regionPart.Shape = Enum.PartType.Cylinder;

const negationPart = new Instance("Part");
negationPart.Position = new Vector3(0, 0, 0);
negationPart.Size = new Vector3(10, 10, 10);
negationPart.Shape = Enum.PartType.Ball;

const region = new RegionNegation(BasePartRegion.fromPart(regionPart), BasePartRegion.fromPart(negationPart));
```

#### constructor

```TypeScript
constructor(region: Region, negation: Region)
```

## Example

This is a short script that prints when a part enters or exits a region:

```TypeScript
import { BasePartRegion, RegionNegation } from "@rbxts/region";
import { Workspace } from "@rbxts/services";

const regionPart = new Instance("Part");
regionPart.Position = new Vector3(0, 0, 0);
regionPart.Size = new Vector3(10, 20, 10);
regionPart.Shape = Enum.PartType.Cylinder;
regionPart.Anchored = true;
regionPart.Transparency = 0.5;
regionPart.Color = new Color3(0, 1, 0);
regionPart.Parent = Workspace;

const negationPart = new Instance("Part");
negationPart.Position = new Vector3(0, 0, 0);
negationPart.Size = new Vector3(10, 10, 10);
negationPart.Shape = Enum.PartType.Ball;
negationPart.Anchored = true;
negationPart.Transparency = 0.5;
negationPart.Color = new Color3(1, 0, 0);
negationPart.Parent = Workspace;

const region = new RegionNegation(BasePartRegion.fromPart(regionPart), BasePartRegion.fromPart(negationPart));

const part = new Instance("Part");
part.Size = new Vector3(1, 1, 1);
part.Position = new Vector3(0, 0, 0);
part.Anchored = true;
part.Shape = Enum.PartType.Ball;
part.Parent = Workspace;

function onEnter() {
	print("entered!");
	region.leftRegion(part).then(onLeave);
}

function onLeave() {
	print("left!");
	region.enteredRegion(part).then(onEnter);
}

region.enteredRegion(part).then(onEnter);
```

https://youtu.be/rmOMUbAeya0
