<?php
declare(strict_types=1);

namespace App\Test\TestCase\Utility;

use App\Utility\GeoJsonFence;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class GeoJsonFenceTest extends TestCase
{
    private const SQUARE = [
        'type' => 'Polygon',
        'coordinates' => [[
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0],
        ]],
    ];

    public function testInsideOutsideAndBoundary(): void
    {
        self::assertTrue(GeoJsonFence::contains(self::SQUARE, 2, 2));
        self::assertFalse(GeoJsonFence::contains(self::SQUARE, 5, 2));
        self::assertTrue(GeoJsonFence::contains(self::SQUARE, 0, 2));
    }

    public function testMultipolygonContainsPointInEitherPolygon(): void
    {
        $geometry = [
            'type' => 'MultiPolygon',
            'coordinates' => [
                self::SQUARE['coordinates'],
                [[
                    [10, 10],
                    [12, 10],
                    [12, 12],
                    [10, 12],
                    [10, 10],
                ]],
            ],
        ];

        self::assertTrue(GeoJsonFence::contains($geometry, 11, 11));
        self::assertFalse(GeoJsonFence::contains($geometry, 7, 7));
    }

    public function testPolygonHoleAndHoleBoundary(): void
    {
        $geometry = [
            'type' => 'Polygon',
            'coordinates' => [
                self::SQUARE['coordinates'][0],
                [
                    [1, 1],
                    [3, 1],
                    [3, 3],
                    [1, 3],
                    [1, 1],
                ],
            ],
        ];

        self::assertFalse(GeoJsonFence::contains($geometry, 2, 2));
        self::assertFalse(GeoJsonFence::contains($geometry, 1, 2));
    }

    public function testRejectsUnclosedOrOutOfRangeRing(): void
    {
        $unclosed = ['type' => 'Polygon', 'coordinates' => [[[0, 0], [1, 0], [1, 1], [0, 1]]]];

        $this->expectException(InvalidArgumentException::class);
        GeoJsonFence::parse($unclosed);
    }

    public function testRejectsOutOfRangeCoordinate(): void
    {
        $geometry = ['type' => 'Polygon', 'coordinates' => [[[0, 0], [181, 0], [1, 1], [0, 0]]]];

        $this->expectException(InvalidArgumentException::class);
        GeoJsonFence::parse($geometry);
    }
}
