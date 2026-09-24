<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * PengaturanPresensiFixture
 */
class PengaturanPresensiFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public string $table = 'pengaturan_presensi';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'id' => 1,
                'jam_subuh_mulai' => '01:15:15',
                'jam_subuh_selesai' => '01:15:15',
                'jam_malam_mulai' => '01:15:15',
                'jam_malam_selesai' => '01:15:15',
                'lat_default' => 1.5,
                'long_default' => 1.5,
                'radius_default_meter' => 1,
                'created_at' => '2026-09-24 01:15:15',
                'updated_at' => '2026-09-24 01:15:15',
            ],
        ];
        parent::init();
    }
}
