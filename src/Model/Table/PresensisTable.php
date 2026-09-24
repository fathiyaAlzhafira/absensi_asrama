<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Presensis Model
 *
 * @property \App\Model\Table\UsersTable&\Cake\ORM\Association\BelongsTo $Users
 *
 * @method \App\Model\Entity\Presensi newEmptyEntity()
 * @method \App\Model\Entity\Presensi newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\Presensi> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Presensi get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\Presensi findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\Presensi patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\Presensi> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\Presensi|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\Presensi saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\Presensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Presensi>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Presensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Presensi> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Presensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Presensi>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Presensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Presensi> deleteManyOrFail(iterable $entities, array $options = [])
 */
class PresensisTable extends Table
{
    /**
     * Initialize method
     *
     * @param array<string, mixed> $config The configuration for the Table.
     * @return void
     */
    public function initialize(array $config): void
    {
        parent::initialize($config);

        $this->setTable('presensis');
        $this->setDisplayField('sesi');
        $this->setPrimaryKey('id');

        $this->belongsTo('Users', [
            'foreignKey' => 'user_id',
            'joinType' => 'INNER',
        ]);
    }

    /**
     * Default validation rules.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     * @return \Cake\Validation\Validator
     */
    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->nonNegativeInteger('user_id')
            ->notEmptyString('user_id');

        $validator
            ->date('tanggal')
            ->requirePresence('tanggal', 'create')
            ->notEmptyDate('tanggal');

        $validator
            ->time('waktu')
            ->requirePresence('waktu', 'create')
            ->notEmptyTime('waktu');

        $validator
            ->scalar('sesi')
            ->requirePresence('sesi', 'create')
            ->notEmptyString('sesi');

        $validator
            ->decimal('lat')
            ->allowEmptyString('lat');

        $validator
            ->decimal('long')
            ->allowEmptyString('long');

        $validator
            ->scalar('status')
            ->notEmptyString('status');

        $validator
            ->scalar('foto_wajah')
            ->maxLength('foto_wajah', 255)
            ->allowEmptyString('foto_wajah');

        $validator
            ->scalar('keterangan')
            ->allowEmptyString('keterangan');

        $validator
            ->dateTime('created_at')
            ->allowEmptyDateTime('created_at');

        $validator
            ->dateTime('updated_at')
            ->allowEmptyDateTime('updated_at');

        return $validator;
    }

    /**
     * Returns a rules checker object that will be used for validating
     * application integrity.
     *
     * @param \Cake\ORM\RulesChecker $rules The rules object to be modified.
     * @return \Cake\ORM\RulesChecker
     */
    public function buildRules(RulesChecker $rules): RulesChecker
    {
        $rules->add($rules->isUnique(['user_id', 'tanggal', 'sesi']), ['errorField' => 'user_id', 'message' => __('This combination of user_id, tanggal and sesi already exists')]);
        $rules->add($rules->existsIn(['user_id'], 'Users'), ['errorField' => 'user_id']);

        return $rules;
    }
}
