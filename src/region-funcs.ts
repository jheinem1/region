const shapes = new Map<Enum.PartType, (point: Vector3, position: CFrame, size: Vector3) => boolean>([
    [
        Enum.PartType.Ball,
        (point, position, size) => {
            return point.sub(position.Position).Magnitude <= size.X;
        },
    ],
    [
        Enum.PartType.Cylinder,
        (point, position, size) => {
            const relPoint = position.PointToObjectSpace(point).div(new Vector3(1, size.X / 2, 1));
            const radius = size.X / 2;
            return math.abs(relPoint.X) <= radius && math.abs(relPoint.Z) <= radius && math.abs(relPoint.Y) <= 1;
        },
    ],
    [
        Enum.PartType.Block,
        (point, position, size) => {
            const relPoint = position.PointToObjectSpace(point).div(size.div(2));
            return math.abs(relPoint.X) <= 1 && math.abs(relPoint.Y) <= 1 && math.abs(relPoint.Z) <= 1;
        },
    ],
]);

export function isInShape(point: Vector3, position: CFrame, size: Vector3, shape: Enum.PartType) {
    return shapes.get(shape)?.(point, position, size) ?? false;
}
