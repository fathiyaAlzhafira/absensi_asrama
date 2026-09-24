<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * PengaturanPresensi Entity
 *
 * @property int $id
 * @property \Cake\I18n\Time $jam_subuh_mulai
 * @property \Cake\I18n\Time $jam_subuh_selesai
 * @property \Cake\I18n\Time $jam_malam_mulai
 * @property \Cake\I18n\Time $jam_malam_selesai
 * @property string $lat_default
 * @property string $long_default
 * @property int $radius_default_meter
 * @property \Cake\I18n\DateTime|null $created_at
 * @property \Cake\I18n\DateTime|null $updated_at
 */
class PengaturanPresensi extends Entity
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
        'jam_subuh_mulai' => true,
        'jam_subuh_selesai' => true,
        'jam_malam_mulai' => true,
        'jam_malam_selesai' => true,
        'lat_default' => true,
        'long_default' => true,
        'radius_default_meter' => true,
        'created_at' => true,
        'updated_at' => true,
    ];
}
