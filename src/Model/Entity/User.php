<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * User Entity
 *
 * @property int $id
 * @property string $nama
 * @property string|null $nim
 * @property string|null $asal
 * @property int|null $kamar_id
 * @property string $jekel
 * @property string $email
 * @property string $password
 * @property string $role
 * @property string|null $no_hp
 * @property string|null $foto_profil
 * @property \Cake\I18n\DateTime|null $created_at
 * @property \Cake\I18n\DateTime|null $updated_at
 *
 * @property \App\Model\Entity\Kamar $kamar
 * @property \App\Model\Entity\Izin[] $izins
 * @property \App\Model\Entity\Presensi[] $presensis
 */
class User extends Entity
{
    /**
     * Fields that can be mass assigned using newEntity() or patchEntity().
     *
     * Note that when '*' is set to true, this allows all unspecified fields to
     * be mass assigned. For security purposes, it is advised to set '*' to false
     * (or remove it), and explicitly make individual fields accessible as needed.
     *
     * @var array<string, bool>
     */
    protected array $_accessible = [
        'nama' => true,
        'nim' => true,
        'asal' => true,
        'kamar_id' => true,
        'jekel' => true,
        'email' => true,
        'password' => true,
        'role' => true,
        'no_hp' => true,
        'foto_profil' => true,
        'created_at' => true,
        'updated_at' => true,
        'kamar' => true,
        'izins' => true,
        'presensis' => true,
    ];

    /**
     * Fields that are excluded from JSON versions of the entity.
     *
     * @var array<string>
     */
    protected array $_hidden = [
        'password',
    ];
}
