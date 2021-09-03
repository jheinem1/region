/* eslint-disable roblox-ts/lua-truthiness */
import { isInShape } from "region-funcs";

abstract class Region {
    public step: () => Promise<unknown> = async () => task.wait(0.1);
    /** Resolves when the part enters the region and rejects if the timeout (if specified) is reached
     * @returns a promise that resolves when the provided part enters the region */
    abstract enteredRegion(part: BasePart, timeout?: number): Promise<void>;
    /** Resolves when the part leaves the region and rejects if the timeout (if specified) is reached
     * @returns a promise that resolves when the provided part leaves the region */
    abstract leftRegion(part: BasePart, timeout?: number): Promise<void>;
    /** Determines whether or not a point is within the region */
    abstract isInRegion(point: Vector3): boolean;
}

/** Simple Region that checks if a specified part enters/exists an area-
 * optimized for multiple part types. Spheres are the most efficient.
 * Can be initialized with a step function that is awaited for custom
 * steps (defaults to `wait(0.1)`). */
export class BasePartRegion extends Region {
    constructor(
        public location: CFrame,
        public size: Vector3,
        public shape: Enum.PartType,
        public step: () => Promise<unknown> = async () => task.wait(0.1),
    ) {
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
    /** Initializes a new `BasePartRegion` using the properties of the provided `BasePart` */
    static fromPart(part: BasePart) {
        return new this(part.CFrame, part.Size, part.IsA("Part") ? part.Shape : Enum.PartType.Block);
    }
    async enteredRegion(part: BasePart, timeout?: number) {
        return new Promise<void>(async (resolve, reject, onCancel) => {
            const start = os.clock();
            let active = true;
            onCancel(() => (active = false));
            while (!this.isInRegion(part.Position)) {
                await this.step();
                if (active && timeout && os.clock() - start > timeout) {
                    reject();
                    return;
                }
            }
            resolve();
        });
    }
    async leftRegion(part: BasePart, timeout?: number) {
        return new Promise<void>(async (resolve, reject, onCancel) => {
            const start = os.clock();
            let active = true;
            onCancel(() => (active = false));
            while (this.isInRegion(part.Position)) {
                await this.step();
                if (active && timeout && os.clock() - start > timeout) {
                    reject();
                    return;
                }
            }
            resolve();
        });
    }
    isInRegion(point: Vector3) {
        return isInShape(point, this.location, this.size, this.shape);
    }
}

/** A handy way to group regions of any type */
export class RegionUnion extends Region {
    constructor(public regions: Region[]) {
        super();
    }
    /** Resolves when the part enters the region and rejects if the timeout (if specified) is reached
     * @returns A promise that resolves when a player enters a region */
    async enteredRegion(part: BasePart, timeout?: number) {
        return Promise.race(this.regions.map((region) => region.enteredRegion(part, timeout)));
    }
    /** Resolves when the part leaves the region and rejects if the timeout (if specified) is reached
     * @returns A promise that resolves when a player leaves a region */
    async leftRegion(part: BasePart, timeout?: number) {
        return Promise.race(this.getRegions(part.Position).map((region) => region.leftRegion(part, timeout)));
    }
    /** Checks if the point is inside any of the regions in the union
     * @returns An array of regions (if any) the player is in */
    getRegions(point: Vector3) {
        return this.regions.filter((region) => region.isInRegion(point));
    }
    /** Checks if the point is inside a region in the union
     * @returns The first region the point was found to be in */
    isInRegion(point: Vector3) {
        return !!this.regions.filter((region) => region.isInRegion(point));
    }
}

/** Negates a region from another region- parts entering overlapping areas will not count as being in the region */
export class RegionNegation extends Region {
    constructor(public region: Region, public negation: Region) {
        super();
    }
    async enteredRegion(part: BasePart, timeout?: number) {
        return new Promise<void>(async (resolve, reject, onCancel) => {
            const start = os.clock();
            let active = true;
            onCancel(() => (active = false));
            while (!this.isInRegion(part.Position)) {
                await this.region.step();
                if (active && timeout && os.clock() - start > timeout) {
                    reject();
                    return;
                }
            }
            resolve();
        });
    }
    async leftRegion(part: BasePart, timeout?: number) {
        return new Promise<void>(async (resolve, reject, onCancel) => {
            const start = os.clock();
            let active = true;
            onCancel(() => (active = false));
            while (this.isInRegion(part.Position)) {
                await this.region.step();
                if (active && timeout && os.clock() - start > timeout) {
                    reject();
                    return;
                }
            }
            resolve();
        });
    }
    isInRegion(point: Vector3) {
        return this.region.isInRegion(point) && !this.negation.isInRegion(point);
    }
}
