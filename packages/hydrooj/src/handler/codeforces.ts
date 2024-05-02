import { Context } from '../context';
import paginate from '../lib/paginate';
import { PRIV } from '../model/builtin';
import user from '../model/user';
import {
    Handler, query, Types,
} from '../service/server';

class CodeforcesRatingHandler extends Handler {
    @query('page', Types.PositiveInt, true)
    async get(domainId: string, page = 1) {
        const [dudocs, upcount, ucount] = await paginate(
            user.getMulti({ _id: { $gt: 1 }, codeforcesRating: { $exists: true } }).sort({ codeforcesRating: -1 }),
            page,
            100,
        );
        const udict = await user.getList(domainId, dudocs.map((dudoc) => dudoc._id));
        const udocs = dudocs.map((i) => udict[i._id]);

        this.response.template = 'codeforces_rating.html';
        this.response.body = {
            udocs, upcount, ucount, page,
        };
    }
}

export async function apply(ctx: Context) {
    ctx.Route('codeforces_rating', '/cf_rating', CodeforcesRatingHandler, PRIV.PRIV_USER_PROFILE);
}
