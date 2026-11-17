<?php
declare(strict_types=1);

use Migrations\BaseMigration;

/**
 * Menyimpan data gedung asrama asli beserta poligon geofence-nya.
 *
 * Sumber data: config/data/gedungs.geojson (FeatureCollection, properti `nama`).
 * Gedung yang sudah ada (berdasarkan nama) tidak ditimpa sehingga perubahan
 * yang dilakukan admin lewat menu Kelola Gedung tetap aman.
 * Setiap gedung baru juga mendapat Lantai 1 agar kamar bisa langsung ditambahkan.
 */
class SeedGedungsAsrama extends BaseMigration
{
    public function up(): void
    {
        $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'gedungs.geojson';
        if (!is_file($path)) {
            return;
        }
        $collection = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        $now = date('Y-m-d H:i:s');

        foreach ($collection['features'] ?? [] as $feature) {
            $name = trim((string)($feature['properties']['nama'] ?? ''));
            $geometry = $feature['geometry'] ?? null;
            if ($name === '' || !is_array($geometry)) {
                continue;
            }

            $existing = $this->findBuilding($name);

            if ($existing) {
                // Lengkapi poligon jika gedung sudah ada tetapi belum punya batas.
                if (empty($existing['geofence_geojson'])) {
                    $this->getQueryBuilder('update')
                        ->update('gedungs')
                        ->set([
                            'geofence_geojson' => json_encode($geometry, JSON_THROW_ON_ERROR),
                            'is_active' => 1,
                            'updated_at' => $now,
                        ])
                        ->where(['id' => $existing['id']])
                        ->execute();
                }
                $buildingId = (int)$existing['id'];
            } else {
                $this->table('gedungs')->insert([
                    'nama' => $name,
                    'id_user' => null,
                    'radius_meter' => 100,
                    'keterangan' => null,
                    'geofence_geojson' => json_encode($geometry, JSON_THROW_ON_ERROR),
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->saveData();
                $buildingId = (int)($this->findBuilding($name)['id'] ?? 0);
                if ($buildingId === 0) {
                    continue;
                }
            }

            $floor = $this->getQueryBuilder('select')
                ->select(['id'])
                ->from('lantais')
                ->where(['gedung_id' => $buildingId])
                ->limit(1)
                ->execute()
                ->fetch('assoc');
            if (!$floor) {
                $this->table('lantais')->insert([
                    'gedung_id' => $buildingId,
                    'nomor_lantai' => 1,
                    'nama' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->saveData();
            }
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function findBuilding(string $name): ?array
    {
        $row = $this->getQueryBuilder('select')
            ->select(['id', 'geofence_geojson'])
            ->from('gedungs')
            ->where(['nama' => $name])
            ->execute()
            ->fetch('assoc');

        return $row ?: null;
    }

    public function down(): void
    {
        // Data gedung tidak dihapus saat rollback agar data operasional tetap aman.
    }
}
