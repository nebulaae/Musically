import Dexie, { Table } from 'dexie';
import { Track } from './models/model.tracks';
import { User } from './models/model.user';

export class MusicAppDatabase extends Dexie {
    tracks!: Table<Track>;
    users!: Table<User>;

    constructor() {
        super('MusicAppDatabase');
        this.version(1).stores({
            tracks: 'id, title, author, album, src, cover, type',
            users: 'id, name, onboarding',
        });
    }
}

// Create a single instance of the database to be used throughout the app
const db = new MusicAppDatabase();

export default db;