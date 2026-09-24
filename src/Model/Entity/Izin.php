<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Izin Entity
 *
 * @property int $id
 * @property int $user_id
 * @property string $jenis_izin
 * @property \Cake\I18n\Date $tanggal_mulai
 * @property \Cake\I18n\Date $tanggal_selesai
 * @property string $keterangan
 * @property string $bukti_file
 * @property string $status
 * @property string|null $catatan_fasil
 * @property int|null $disetujui_oleh
 * @property \Cake\I18n\DateTime|null $created_at
 * @property \Cake\I18n\DateTime|null $updated_at
 *
 * @property \App\Model\Entity\User $user
 */
class Izin extends Entity
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
        'jenis_izin' => true,
        'tanggal_mulai' => true,
        'tanggal_selesai' => true,
        'keterangan' => true,
        'bukti_file' => true,
        'status' => true,
        'catatan_fasil' => true,
        'disetujui_oleh' => true,
        'created_at' => true,
        'updated_at' => true,
        'user' => true,
    ];
}
