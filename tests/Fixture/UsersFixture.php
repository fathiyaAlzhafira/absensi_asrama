<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * UsersFixture
 */
class UsersFixture extends TestFixture
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
                'nim' => 'Lorem ipsum dolor ',
                'asal' => 'Lorem ipsum dolor sit amet',
                'kamar_id' => 1,
                'jekel' => 'Lorem ipsum dolor sit amet',
                'email' => 'Lorem ipsum dolor sit amet',
                'password' => 'Lorem ipsum dolor sit amet',
                'role' => 'Lorem ipsum dolor sit amet',
                'no_hp' => 'Lorem ipsum dolor ',
                'foto_profil' => 'Lorem ipsum dolor sit amet',
                'created_at' => '2026-09-24 01:15:16',
                'updated_at' => '2026-09-24 01:15:16',
            ],
        ];
        parent::init();
    }
}
