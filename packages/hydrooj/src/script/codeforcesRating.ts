import PQueue from 'p-queue';
import Schema from 'schemastery';
import superagent from 'superagent';
import db from '../service/db';

async function getCodeforcesHandleInfo(handle: string) {
    const data = await superagent.get(`https://codeforces.com/api/user.info?handles=${handle}`).send()
        .then((res) => res.body)
        .catch(() => ({}));
    return data.result ? data.result[0] : null;
}

async function getCodeforcesRating(handle: string): Promise<number | null> {
    const info = await getCodeforcesHandleInfo(handle);
    if (!info || !info.rating) return null;
    return info.rating;
}

export async function run(_, report) {
    const coll = db.collection('user');
    const users = await coll.find({ codeforcesHandle: { $exists: true, $ne: '' } }).toArray();
    report({ message: `Found ${users.length} users with codeforces handle` });
    const queue = new PQueue({ concurrency: 1 });
    for (const user of users) {
        queue.add(async () => {
            const rating = await getCodeforcesRating(user.codeforcesHandle);
            report({ message: `User [${user._id}]${user.uname} (${user.codeforcesHandle}) rating: ${rating}` });
            if (rating !== null) {
                await coll.updateOne({ _id: user._id }, { $set: { codeforcesRating: rating } });
            }
        });
    }
    await queue.onIdle();
    report({ message: 'Done' });
}

export const apply = (ctx) => ctx.addScript('codeforcesRating', 'Calculate user\'s codeforces rating', Schema.any(), run);
