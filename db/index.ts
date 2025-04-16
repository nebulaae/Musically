import Dexie, { Table } from 'dexie';
import { Track } from './models/tracks';
import { User } from './models/user';

export class Database extends Dexie {
    tracks!: Table<Track>;
    users!: Table<User>;

    constructor() {
        super('Database');
        this.version(1).stores({
            tracks: 'id, title, author, album, src, cover, type',
            users: 'id, name',
        });
    }
}

// Create a single instance of the database to be used throughout the app
const db = new Database();

export default db;