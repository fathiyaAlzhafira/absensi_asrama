<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Kamars Model
 *
 * @property \App\Model\Table\GedungsTable&\Cake\ORM\Association\BelongsTo $Gedungs
 * @property \App\Model\Table\UsersTable&\Cake\ORM\Association\HasMany $Users
 *
 * @method \App\Model\Entity\Kamar newEmptyEntity()
 * @method \App\Model\Entity\Kamar newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\Kamar> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Kamar get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\Kamar findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\Kamar patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\Kamar> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\Kamar|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\Kamar saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\Kamar>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Kamar>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Kamar>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Kamar> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Kamar>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Kamar>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Kamar>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Kamar> deleteManyOrFail(iterable $entities, array $options = [])
 */
class KamarsTable extends Table
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

        $this->setTable('kamars');
        $this->setDisplayField('nomor_kamar');
        $this->setPrimaryKey('id');

        $this->belongsTo('Gedungs', [
            'foreignKey' => 'gedung_id',
            'joinType' => 'INNER',
        ]);
        $this->hasMany('Users', [
            'foreignKey' => 'kamar_id',
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
            ->nonNegativeInteger('gedung_id')
            ->notEmptyString('gedung_id');

        $validator
            ->scalar('nomor_kamar')
            ->maxLength('nomor_kamar', 20)
            ->requirePresence('nomor_kamar', 'create')
            ->notEmptyString('nomor_kamar');

        $validator
            ->integer('lantai')
            ->notEmptyString('lantai');

        $validator
            ->integer('kapasitas')
            ->notEmptyString('kapasitas');

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
        $rules->add($rules->existsIn(['gedung_id'], 'Gedungs'), ['errorField' => 'gedung_id']);

        return $rules;
    }
}
