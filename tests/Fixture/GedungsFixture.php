<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * GedungsFixture
 */
class GedungsFixture extends TestFixture
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
                'nama' => 'Lorem ipsum dolor sit amet',
                'id_user' => 1,
                'latitude' => 1.5,
                'longitude' => 1.5,
                'radius_meter' => 1,
                'keterangan' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
                'created_at' => '2026-09-24 01:15:14',
                'updated_at' => '2026-09-24 01:15:14',
            ],
        ];
        parent::init();
    }
}
