<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Presensi Entity
 *
 * @property int $id
 * @property int $user_id
 * @property \Cake\I18n\Date $tanggal
 * @property \Cake\I18n\Time $waktu
 * @property string $sesi
 * @property string|null $lat
 * @property string|null $long
 * @property string $status
 * @property string|null $foto_wajah
 * @property string|null $keterangan
 * @property \Cake\I18n\DateTime|null $created_at
 * @property \Cake\I18n\DateTime|null $updated_at
 *
 * @property \App\Model\Entity\User $user
 */
class Presensi extends Entity
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
        'user_id' => true,
        'tanggal' => true,
        'waktu' => true,
        'sesi' => true,
        'lat' => true,
        'long' => true,
        'status' => true,
        'foto_wajah' => true,
        'keterangan' => true,
        'created_at' => true,
        'updated_at' => true,
        'user' => true,
    ];
}
