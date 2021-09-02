/* eslint-disable roblox-ts/lua-truthiness */
import { RunService, Workspace } from "@rbxts/services";
import { isInShape } from "region-funcs";

abstract class Region {
    /**
     * @returns A promise that resolves when a player enters the region
     */
    abstract enteredRegion(part: BasePart): Promise<void>;
    /**
     * @returns A promise that resolves when a player leaves the region
     */
    abstract leftRegion(part: BasePart): Promise<void>;
    /**
     * Checks if the player/character is inside the region.
     * @returns True if the player is in the region, false if not
     */
    abstract isInRegion(point: Vector3): boolean;
}

/**
 * Simple Region that checks if a specified part enters/exists an area-
 * optimized for multiple part types. Spheres are the most efficient.
 */
export class BasePartRegion extends Region {
    constructor(public location: CFrame, public size: Vector3, public shape: Enum.PartType) {
        super();
        // eliminates the potential of the size extending beyond the shape for spheres and cylinders
        switch (shape) {
            case Enum.PartType.Ball:
                const ballRadius = math.max(size.X, size.Y, size.Z);
                this.size = new Vector3(ballRadius, ballRadius, ballRadius);
                break;
            case Enum.PartType.Cylinder:
                const cylinderRadius = math.max(size.X, size.Z);
                this.size = new Vector3(cylinderRadius, size.Y, cylinderRadius);
                break;
        }
    }
    static fromPart(part: BasePart) {
        return new this(part.CFrame, part.Size, part.IsA("Part") ? part.Shape : Enum.PartType.Block);
    }
    async enteredRegion(part: BasePart) {
        while (this.isInRegion(part.Position)) wait(0.1);
    }
    async leftRegion(part: BasePart) {
        while (this.isInRegion(part.Position)) wait(0.1);
    }
    isInRegion(point: Vector3) {
        return isInShape(point, this.location, this.size, this.shape);
    }
}

/**
 * A handy way to group regions of any type
 */
export class RegionUnion {
    constructor(public regions: Region[]) {}
    /**
     * @returns A promise that resolves when a player enters a region
     */
    async enteredRegion(part: BasePart) {
        return Promise.race(this.regions.map((region) => region.enteredRegion(part)));
    }
    /**
     * @returns A promise that resolves when a player leaves a region
     */
    async leftRegion(part: BasePart) {
        return Promise.race(this.isInRegions(part.Position).map((region) => region.leftRegion(part)));
    }
    /**
     * Checks if the player/character is inside all regions.
     * @returns An array of regions (if any) the player is in
     */
    isInRegions(point: Vector3) {
        return this.regions.filter((region) => region.isInRegion(point));
    }
    /**
     * Checks if the player/character is inside a single region.
     * @returns A region (if any) the player is in
     */
    isInRegion(point: Vector3) {
        return this.regions.find((region) => region.isInRegion(point));
    }
}
