import { Context } from '../context';
import { PRIV } from '../model/builtin';
import user from '../model/user';
import {
    Handler, query, Types,
} from '../service/server';

class CodeforcesRatingHandler extends Handler {
    @query('page', Types.PositiveInt, true)
    async get(domainId: string, page = 1) {
        const [dudocs, upcount, ucount] = await this.paginate(
            user.getMulti({ _id: { $gt: 1 }, codeforcesRating: { $gt: 0 } }).sort({ codeforcesRating: -1 }),
            page,
            'ranking',
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
