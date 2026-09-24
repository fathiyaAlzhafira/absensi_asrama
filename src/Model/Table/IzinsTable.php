<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Izins Model
 *
 * @property \App\Model\Table\UsersTable&\Cake\ORM\Association\BelongsTo $Users
 *
 * @method \App\Model\Entity\Izin newEmptyEntity()
 * @method \App\Model\Entity\Izin newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\Izin> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Izin get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\Izin findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\Izin patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\Izin> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\Izin|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\Izin saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\Izin>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Izin>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Izin>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Izin> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Izin>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Izin>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Izin>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Izin> deleteManyOrFail(iterable $entities, array $options = [])
 */
class IzinsTable extends Table
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

        $this->setTable('izins');
        $this->setDisplayField('jenis_izin');
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
            ->scalar('jenis_izin')
            ->requirePresence('jenis_izin', 'create')
            ->notEmptyString('jenis_izin');

        $validator
            ->date('tanggal_mulai')
            ->requirePresence('tanggal_mulai', 'create')
            ->notEmptyDate('tanggal_mulai');

        $validator
            ->date('tanggal_selesai')
            ->requirePresence('tanggal_selesai', 'create')
            ->notEmptyDate('tanggal_selesai');

        $validator
            ->scalar('keterangan')
            ->requirePresence('keterangan', 'create')
            ->notEmptyString('keterangan');

        $validator
            ->scalar('bukti_file')
            ->maxLength('bukti_file', 255)
            ->requirePresence('bukti_file', 'create')
            ->notEmptyFile('bukti_file');

        $validator
            ->scalar('status')
            ->notEmptyString('status');

        $validator
            ->scalar('catatan_fasil')
            ->allowEmptyString('catatan_fasil');

        $validator
            ->nonNegativeInteger('disetujui_oleh')
            ->allowEmptyString('disetujui_oleh');

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
        $rules->add($rules->existsIn(['user_id'], 'Users'), ['errorField' => 'user_id']);

        return $rules;
    }
}
