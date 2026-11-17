<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Lantai Entity
 *
 * @property int $id
 * @property int $gedung_id
 * @property int $nomor_lantai
 * @property string|null $nama
 * @property \Cake\I18n\DateTime|null $created_at
 * @property \Cake\I18n\DateTime|null $updated_at
 * @property \App\Model\Entity\Gedung $gedung
 */
class Lantai extends Entity
{
    protected array $_accessible = [
        'gedung_id' => true,
        'nomor_lantai' => true,
        'nama' => true,
        'created_at' => true,
        'updated_at' => true,
        'gedung' => true,
    ];
}
