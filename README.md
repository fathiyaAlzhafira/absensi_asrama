# CakePHP Application Skeleton

![Build Status](https://github.com/cakephp/app/actions/workflows/ci.yml/badge.svg?branch=5.x)
[![Total Downloads](https://img.shields.io/packagist/dt/cakephp/app.svg?style=flat-square)](https://packagist.org/packages/cakephp/app)
[![PHPStan](https://img.shields.io/badge/PHPStan-level%208-brightgreen.svg?style=flat-square)](https://github.com/phpstan/phpstan)

A skeleton for creating applications with [CakePHP](https://cakephp.org) 5.x.

The framework source code can be found here: [cakephp/cakephp](https://github.com/cakephp/cakephp).

## Installation

1. Download [Composer](https://getcomposer.org/doc/00-intro.md) or update `composer self-update`.
2. Run `php composer.phar create-project --prefer-dist cakephp/app [app_name]`.

If Composer is installed globally, run

```bash
composer create-project --prefer-dist cakephp/app
```

In case you want to use a custom app dir name (e.g. `/myapp/`):

```bash
composer create-project --prefer-dist cakephp/app myapp
```

You can now either use your machine's webserver to view the default home page, or start
up the built-in webserver with:

```bash
bin/cake server -p 8765
```

Then visit `http://localhost:8765` to see the welcome page.

## Database migrations

The database schema is managed by versioned files in `config/Migrations`. For a
new database, create the configured database and run the backend with:

```bash
composer start
```

This applies pending migrations before starting the CakePHP server on port 8765.
For future schema changes, add a new migration; do not edit an already-applied
migration or import `config/schema/absensi_asrama.sql` during startup. That SQL
file drops tables and is not the update mechanism.

If the database was previously initialized from that SQL file, its tables
already exist but the initial migration may still show as `down`. Once, after
confirming the existing schema is present, adopt the baseline with:

```bash
php bin/cake.php migrations mark_migrated --target 20260924011454
```

Then use `composer start`; only migrations not yet recorded as applied will run.

## Authenticated attendance and building APIs

`POST /api/auth/login` returns an opaque Bearer token. The server stores only its
SHA-256 hash; tokens expire after 30 days and `POST /api/auth/logout` revokes the
current token. Send it as `Authorization: Bearer <token>` for protected routes.

Attendance (`POST /api/presensis`, `GET /api/presensis/my-history`,
`GET /api/presensis/today-status`, and `GET /api/presensis/{id}/photo`) uses the
authenticated account. To submit attendance, send the scheduled `sesi`, device
`lat` and `long`, and `foto_wajah` as a JPEG data URL. The server resolves the
resident's assigned room and building, verifies the active building geofence,
and does not accept a client-supplied building identifier or inside-area flag.

Administrator routes require a verified token for a user whose database role is
`admin`:

- `GET /api/gedungs` lists buildings with parsed `geofence_geojson`, active
  status, supervisor, room count, and resident count.
- `POST /api/gedungs` and `PUT /api/gedungs/{id}` accept writable building
  fields `nama`, `id_user`, `latitude`, `longitude`, `radius_meter`,
  `keterangan`, and a GeoJSON Polygon or MultiPolygon in `geofence_geojson`.
- `PATCH /api/gedungs/{id}/status` accepts `{"is_active": false}`. Active
  buildings must have a valid geofence. A building can be deleted only while
  it has no rooms; otherwise deactivate it to preserve room assignments.
- `GET /api/kamars` lists rooms with `gedung_id`, `gedung_nama`, and
  `jumlah_penghuni`. `POST /api/kamars` and `PUT /api/kamars/{id}` accept
  `gedung_id`, `nomor_kamar`, `lantai`, and `kapasitas`. Room numbers are unique
  within a building.
- `DELETE /api/kamars/{id}` is rejected with HTTP 409 while residents are
  assigned to the room.

The admin building page can import a GeoJSON FeatureCollection. Features are
matched to existing buildings by trimmed, case-insensitive exact name; unmatched
features create buildings with their polygon. Room records determine each
resident's building, so update a room's `gedung_id` in the room page when an
imported feature represents a different existing building.

Residents can call authenticated `GET /api/gedungs/my-assignment` to receive
`data.gedung` (`id`, `nama`, `is_active`, and parsed geometry) and `data.kamar`
(`id` and `nomor_kamar`). Missing assignments fail with HTTP 404. API responses
retain the standard `{status, message, data}` success and `{status, message,
errors}` error envelopes.

## Demo app

Check out the [5.x-demo branch](https://github.com/cakephp/app/tree/5.x-demo), which contains demo migrations and a seeder.
See the [README](https://github.com/cakephp/app/blob/5.x-demo/README.md) on how to get it running.

## Update

Since this skeleton is a starting point for your application and various files
would have been modified as per your needs, there isn't a way to provide
automated upgrades, so you have to do any updates manually.

## Configuration

Read and edit the environment specific `config/app_local.php` and set up the
`'Datasources'` and any other configuration relevant for your application.
Other environment agnostic settings can be changed in `config/app.php`.

## Layout

The app skeleton uses [Milligram](https://milligram.io/) (v1.3) minimalist CSS
framework by default. You can, however, replace it with any other library or
custom styles.
