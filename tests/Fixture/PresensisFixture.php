<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * PresensisFixture
 */
class PresensisFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public string $table = 'presensis';
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
                'user_id' => 1,
                'tanggal' => '2026-09-24',
                'waktu' => '01:15:16',
                'sesi' => 'Lorem ipsum dolor sit amet',
                'lat' => 1.5,
                'long' => 1.5,
                'status' => 'Lorem ipsum dolor sit amet',
                'foto_wajah' => 'Lorem ipsum dolor sit amet',
                'keterangan' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
                'created_at' => '2026-09-24 01:15:16',
                'updated_at' => '2026-09-24 01:15:16',
            ],
        ];
        parent::init();
    }
}
