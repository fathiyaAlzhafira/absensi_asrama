<?php
declare(strict_types=1);

use Migrations\BaseMigration;

/**
 * Menghapus gedung contoh lama ("Asrama Putra Unand (Gedung A)" dan
 * "Asrama Putri Unand (Gedung B)") setelah memindahkan kamar yang terkait
 * ke gedung asli (RPX dan Rusunawa), serta memastikan setiap gedung aktif
 * memiliki minimal Lantai 1.
 */
class RemoveDummyGedungs extends BaseMigration
{
    public function up(): void
    {
        $now = date('Y-m-d H:i:s');

        $rpx = $this->findBuildingByName('RPX');
        $rusunawa = $this->findBuildingByName('Rusunawa');
        $fallbackBuildingId = (int)($rpx['id'] ?? $rusunawa['id'] ?? 0);

        $dummyMappings = [
            'Asrama Putra Unand (Gedung A)' => (int)($rpx['id'] ?? $fallbackBuildingId),
            'Asrama Putri Unand (Gedung B)' => (int)($rusunawa['id'] ?? $fallbackBuildingId),
        ];

        foreach ($dummyMappings as $dummyName => $targetBuildingId) {
            $dummy = $this->findBuildingByName($dummyName);
            if (!$dummy) {
                continue;
            }
            $dummyId = (int)$dummy['id'];

            if ($targetBuildingId > 0 && $targetBuildingId !== $dummyId) {
                // Pindahkan kamar dari gedung contoh ke gedung asli
                $rooms = $this->getQueryBuilder('select')
                    ->select(['id', 'nomor_kamar', 'lantai'])
                    ->from('kamars')
                    ->where(['gedung_id' => $dummyId])
                    ->execute()
                    ->fetchAll('assoc');

                foreach ($rooms as $room) {
                    $floorNumber = (int)($room['lantai'] ?? 1);
                    $this->ensureFloor($targetBuildingId, $floorNumber, $now);

                    $conflict = $this->getQueryBuilder('select')
                        ->select(['id'])
                        ->from('kamars')
                        ->where([
                            'gedung_id' => $targetBuildingId,
                            'nomor_kamar' => $room['nomor_kamar'],
                        ])
                        ->limit(1)
                        ->execute()
                        ->fetch('assoc');

                    if (!$conflict) {
                        $this->getQueryBuilder('update')
                            ->update('kamars')
                            ->set([
                                'gedung_id' => $targetBuildingId,
                                'updated_at' => $now,
                            ])
                            ->where(['id' => $room['id']])
                            ->execute();
                    }
                }
            }

            // Hapus lantai dan sisa kamar pada gedung contoh, lalu hapus gedung contohnya
            $this->getQueryBuilder('delete')->delete('lantais')->where(['gedung_id' => $dummyId])->execute();
            $this->getQueryBuilder('delete')->delete('kamars')->where(['gedung_id' => $dummyId])->execute();
            $this->getQueryBuilder('delete')->delete('gedungs')->where(['id' => $dummyId])->execute();
        }

        // Pastikan semua gedung aktif memiliki minimal Lantai 1
        $activeBuildings = $this->getQueryBuilder('select')
            ->select(['id'])
            ->from('gedungs')
            ->execute()
            ->fetchAll('assoc');

        foreach ($activeBuildings as $building) {
            $this->ensureFloor((int)$building['id'], 1, $now);
        }
    }

    public function down(): void
    {
        // Gedung contoh tidak dikembalikan saat rollback.
    }

    /**
     * @return array<string, mixed>|null
     */
    private function findBuildingByName(string $name): ?array
    {
        $row = $this->getQueryBuilder('select')
            ->select(['id', 'nama'])
            ->from('gedungs')
            ->where(['nama' => $name])
            ->limit(1)
            ->execute()
            ->fetch('assoc');

        return $row ?: null;
    }

    private function ensureFloor(int $buildingId, int $floorNumber, string $now): void
    {
        $exists = $this->getQueryBuilder('select')
            ->select(['id'])
            ->from('lantais')
            ->where([
                'gedung_id' => $buildingId,
                'nomor_lantai' => $floorNumber,
            ])
            ->limit(1)
            ->execute()
            ->fetch('assoc');

        if (!$exists) {
            $this->table('lantais')->insert([
                'gedung_id' => $buildingId,
                'nomor_lantai' => $floorNumber,
                'nama' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ])->saveData();
        }
    }
}
