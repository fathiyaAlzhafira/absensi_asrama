<?php
/**
 * Routes configuration.
 *
 * In this file, you set up routes to your controllers and their actions.
 * Routes are very important mechanism that allows you to freely connect
 * different URLs to chosen controllers and their actions (functions).
 *
 * It's loaded within the context of `Application::routes()` method which
 * receives a `RouteBuilder` instance `$routes` as method argument.
 *
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link          https://cakephp.org CakePHP(tm) Project
 * @license       https://opensource.org/licenses/mit-license.php MIT License
 */

use Cake\Routing\Route\DashedRoute;
use Cake\Routing\RouteBuilder;

/*
 * This file is loaded in the context of the `Application` class.
 * So you can use `$this` to reference the application class instance
 * if required.
 */
return function (RouteBuilder $routes): void {
    /*
     * The default class to use for all routes
     *
     * The following route classes are supplied with CakePHP and are appropriate
     * to set as the default:
     *
     * - Route
     * - InflectedRoute
     * - DashedRoute
     *
     * If no call is made to `Router::defaultRouteClass()`, the class used is
     * `Route` (`Cake\Routing\Route\Route`)
     *
     * Note that `Route` does not do any inflections on URLs which will result in
     * inconsistently cased URLs when used with `{plugin}`, `{controller}` and
     * `{action}` markers.
     */
    $routes->setRouteClass(DashedRoute::class);

    $routes->scope('/', function (RouteBuilder $builder): void {
        /*
         * Here, we are connecting '/' (base path) to a controller called 'Pages',
         * its action called 'display', and we pass a param to select the view file
         * to use (in this case, templates/Pages/home.php)...
         */
        $builder->connect('/', ['controller' => 'Pages', 'action' => 'display', 'home']);

        /*
         * ...and connect the rest of 'Pages' controller's URLs.
         */
        $builder->connect('/pages/*', 'Pages::display');

        /*
         * Connect catchall routes for all controllers.
         *
         * The `fallbacks` method is a shortcut for
         *
         * ```
         * $builder->connect('/{controller}', ['action' => 'index']);
         * $builder->connect('/{controller}/{action}/*', []);
         * ```
         *
         * It is NOT recommended to use fallback routes after your initial prototyping phase!
         * See https://book.cakephp.org/5/en/development/routing.html#fallbacks-method for more information
         */
        $builder->fallbacks();
    });

    /*
     * REST API Routes (/api/*)
     */
    $routes->prefix('Api', function (RouteBuilder $builder): void {
        $builder->setExtensions(['json']);

        // Auth
        $builder->connect('/auth/login', ['controller' => 'Auth', 'action' => 'login']);
        $builder->connect('/auth/profile', ['controller' => 'Auth', 'action' => 'profile']);
        $builder->connect('/auth/logout', ['controller' => 'Auth', 'action' => 'logout']);

        // Presensi
        $builder->connect('/presensis/my-history', ['controller' => 'Presensis', 'action' => 'myHistory']);
        $builder->connect('/presensis/today-status', ['controller' => 'Presensis', 'action' => 'todayStatus']);
        $builder->connect('/presensis', ['controller' => 'Presensis', 'action' => 'add']);

        // Izin
        $builder->connect('/izins/my-permits', ['controller' => 'Izins', 'action' => 'myPermits']);
        $builder->connect('/izins/pending', ['controller' => 'Izins', 'action' => 'pending']);
        $builder->connect('/izins/{id}/verify', ['controller' => 'Izins', 'action' => 'verify'])->setPass(['id']);
        $builder->connect('/izins', ['controller' => 'Izins', 'action' => 'add']);

        // Users (Admin)
        $builder->connect('/users', ['controller' => 'Users', 'action' => 'index']);
        $builder->connect('/users/add', ['controller' => 'Users', 'action' => 'add']);
        $builder->connect('/users/{id}', ['controller' => 'Users', 'action' => 'edit'])->setPass(['id'])->setMethods(['PUT', 'POST']);
        $builder->connect('/users/{id}/delete', ['controller' => 'Users', 'action' => 'delete'])->setPass(['id'])->setMethods(['DELETE', 'POST']);

        $builder->fallbacks();
    });
};
