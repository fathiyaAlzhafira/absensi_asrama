<?php
declare(strict_types=1);

namespace App\Utility;

use InvalidArgumentException;
use JsonException;

final class GeoJsonFence
{
    /**
     * Decode and validate a GeoJSON Polygon or MultiPolygon geometry.
     *
     * @param array<mixed>|string $geometry
     * @return array{type: string, coordinates: array<mixed>}
     */
    public static function parse(array|string $geometry): array
    {
        if (is_string($geometry)) {
            try {
                $geometry = json_decode($geometry, true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException $exception) {
                throw new InvalidArgumentException('Geofence must contain valid JSON.', 0, $exception);
            }
        }

        if (!is_array($geometry) || !in_array($geometry['type'] ?? null, ['Polygon', 'MultiPolygon'], true)) {
            throw new InvalidArgumentException('Geofence must be a Polygon or MultiPolygon geometry.');
        }

        $type = $geometry['type'];
        $coordinates = $geometry['coordinates'] ?? null;
        if (!is_array($coordinates) || $coordinates === []) {
            throw new InvalidArgumentException('Geofence coordinates are required.');
        }

        $polygons = $type === 'Polygon' ? [$coordinates] : $coordinates;
        $normalizedPolygons = [];
        foreach ($polygons as $polygon) {
            if (!is_array($polygon) || $polygon === []) {
                throw new InvalidArgumentException('Each polygon must contain at least one ring.');
            }
            $normalizedPolygon = [];
            foreach ($polygon as $ring) {
                $normalizedPolygon[] = self::validateRing($ring);
            }
            $normalizedPolygons[] = $normalizedPolygon;
        }

        $coordinates = $type === 'Polygon' ? $normalizedPolygons[0] : $normalizedPolygons;
        return ['type' => $type, 'coordinates' => $coordinates];
    }

    /**
     * Coordinates are supplied in API order (latitude, longitude).
     *
     * @param array{type: string, coordinates: array<mixed>} $geometry
     */
    public static function contains(array $geometry, float $latitude, float $longitude): bool
    {
        if (!is_finite($latitude) || !is_finite($longitude)
            || $latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            return false;
        }

        $geometry = self::parse($geometry);
        $polygons = $geometry['type'] === 'Polygon'
            ? [$geometry['coordinates']]
            : $geometry['coordinates'];

        foreach ($polygons as $polygon) {
            $outer = self::ringRelation($polygon[0], $longitude, $latitude);
            if ($outer === 0) {
                continue;
            }

            $inHole = false;
            foreach (array_slice($polygon, 1) as $hole) {
                $holeRelation = self::ringRelation($hole, $longitude, $latitude);
                if ($holeRelation !== 0) {
                    $inHole = true;
                    break;
                }
            }
            if (!$inHole) {
                return true;
            }
        }

        return false;
    }

    private static function validateRing(mixed $ring): array
    {
        if (!is_array($ring) || count($ring) < 4) {
            throw new InvalidArgumentException('Each polygon ring must have at least four positions.');
        }

        $first = null;
        $last = null;
        $normalizedRing = [];
        foreach ($ring as $position) {
            if (!is_array($position) || count($position) < 2
                || !is_numeric($position[0]) || !is_numeric($position[1])) {
                throw new InvalidArgumentException('Each position must contain numeric longitude and latitude.');
            }
            $longitude = (float)$position[0];
            $latitude = (float)$position[1];
            if (!is_finite($longitude) || !is_finite($latitude)
                || $longitude < -180 || $longitude > 180 || $latitude < -90 || $latitude > 90) {
                throw new InvalidArgumentException('Geofence coordinates are outside valid longitude/latitude ranges.');
            }
            $coordinate = [$longitude, $latitude];
            if (count($position) > 2) {
                array_push($coordinate, ...array_slice($position, 2));
            }
            $first ??= $coordinate;
            $last = $coordinate;
            $normalizedRing[] = $coordinate;
        }

        if ($first !== $last) {
            throw new InvalidArgumentException('Polygon rings must be closed.');
        }

        return $normalizedRing;
    }

    /**
     * @param array<mixed> $ring
     * @return int 1 inside, 0 outside, 2 boundary
     */
    private static function ringRelation(array $ring, float $x, float $y): int
    {
        $inside = false;
        $count = count($ring);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = (float)$ring[$i][0];
            $yi = (float)$ring[$i][1];
            $xj = (float)$ring[$j][0];
            $yj = (float)$ring[$j][1];

            if (self::isOnSegment($x, $y, $xi, $yi, $xj, $yj)) {
                return 2;
            }

            if (($yi > $y) !== ($yj > $y)
                && $x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi) {
                $inside = !$inside;
            }
        }

        return $inside ? 1 : 0;
    }

    private static function isOnSegment(
        float $x,
        float $y,
        float $x1,
        float $y1,
        float $x2,
        float $y2
    ): bool {
        $cross = ($x - $x1) * ($y2 - $y1) - ($y - $y1) * ($x2 - $x1);
        $scale = max(1.0, abs($x1), abs($x2), abs($y1), abs($y2));
        if (abs($cross) > 1e-10 * $scale) {
            return false;
        }

        return $x >= min($x1, $x2) - 1e-10 && $x <= max($x1, $x2) + 1e-10
            && $y >= min($y1, $y2) - 1e-10 && $y <= max($y1, $y2) + 1e-10;
    }
}
