<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * KamarsFixture
 */
class KamarsFixture extends TestFixture
{
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
                'gedung_id' => 1,
                'nomor_kamar' => 'Lorem ipsum dolor ',
                'lantai' => 1,
                'kapasitas' => 1,
                'created_at' => '2026-09-24 01:15:15',
                'updated_at' => '2026-09-24 01:15:15',
            ],
        ];
        parent::init();
    }
}
