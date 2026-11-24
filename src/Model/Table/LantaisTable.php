<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

class LantaisTable extends Table
{
    public function initialize(array $config): void
    {
        parent::initialize($config);
        $this->setTable('lantai');
        $this->setDisplayField('nomor_lantai');
        $this->setPrimaryKey('id');

        $this->belongsTo('Gedungs', [
            'foreignKey' => 'gedung_id',
            'joinType' => 'INNER',
        ]);
    }

    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->integer('gedung_id')
            ->requirePresence('gedung_id', 'create')
            ->notEmptyString('gedung_id');
        $validator
            ->integer('nomor_lantai')
            ->requirePresence('nomor_lantai', 'create')
            ->notEmptyString('nomor_lantai');
        $validator
            ->scalar('nama')
            ->maxLength('nama', 80)
            ->allowEmptyString('nama');

        return $validator;
    }

    public function buildRules(RulesChecker $rules): RulesChecker
    {
        $rules->add($rules->existsIn(['gedung_id'], 'Gedungs'), ['errorField' => 'gedung_id']);
        $rules->add(
            $rules->isUnique(['gedung_id', 'nomor_lantai']),
            ['errorField' => 'nomor_lantai']
        );

        return $rules;
    }
}
