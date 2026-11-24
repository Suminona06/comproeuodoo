import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

import {
  buildNewsViewModel,
  buildHomeViewModel,
  getHomePageData
} from '../services/homeService.js';
import bannerModel from '../models/bannerModel.js';
import brandModel from '../models/brandModel.js';
import postModel from '../models/postModel.js';
import homeContentModel from '../models/homeContentModel.js';
import productCategoryModel from '../models/productCategoryModel.js';

const ID_DICT = {
  'home.news_type_berita': 'Berita',
  'home.news_type_pers': 'Siaran Pers',
  'home.news_type_blog': 'Blog'
};

const EN_DICT = {
  'home.news_type_berita': 'News',
  'home.news_type_pers': 'Press Release',
  'home.news_type_blog': 'Blog'
};

function makeTranslator(dict) {
  return (key) => dict[key] || key;
}

function makeRawPost(index, overrides = {}) {
  return {
    id: index + 1,
    slug: `post-${index + 1}`,
    title_id: `Judul ${index + 1}`,
    title_en: `Title ${index + 1}`,
    type: 'berita',
    published_at: '2026-11-20T00:00:00.000Z',
    cover_image: `/images/post-${index + 1}.webp`,
    ...overrides
  };
}

describe('homeService Latest News ViewModel & Query (T-408)', () => {
  it('slices rawPosts to MAX_HOME_POSTS (6) and rotates fallbackImage', () => {
    const rawPosts = Array.from({ length: 8 }, (_, idx) => makeRawPost(idx));
    const result = buildNewsViewModel(rawPosts, 'id', makeTranslator(ID_DICT));

    assert.equal(result.items.length, 6);
    assert.equal(result.items[0].fallbackImage, '/images/post-eco-community.jpg');
    assert.equal(result.items[1].fallbackImage, '/images/post-school-recycling.jpg');
    assert.equal(result.items[2].fallbackImage, '/images/post-eco-community.jpg');
    assert.equal(result.items[5].fallbackImage, '/images/post-school-recycling.jpg');
  });

  it('maps postType and localized typeLabel for berita, pers, and blog in id & en', () => {
    const rawPosts = [
      makeRawPost(0, { type: 'berita' }),
      makeRawPost(1, { type: 'pers' }),
      makeRawPost(2, { type: 'blog' })
    ];

    const idNews = buildHomeViewModel(
      { latestPosts: rawPosts },
      { currentLang: 'id', t: makeTranslator(ID_DICT) }
    ).news;

    assert.deepEqual(
      idNews.items.map((item) => ({ postType: item.postType, typeLabel: item.typeLabel })),
      [
        { postType: 'berita', typeLabel: 'Berita' },
        { postType: 'pers', typeLabel: 'Siaran Pers' },
        { postType: 'blog', typeLabel: 'Blog' }
      ]
    );

    const enNews = buildHomeViewModel(
      { latestPosts: rawPosts },
      { currentLang: 'en', t: makeTranslator(EN_DICT) }
    ).news;

    assert.deepEqual(
      enNews.items.map((item) => ({ postType: item.postType, typeLabel: item.typeLabel })),
      [
        { postType: 'berita', typeLabel: 'News' },
        { postType: 'pers', typeLabel: 'Press Release' },
        { postType: 'blog', typeLabel: 'Blog' }
      ]
    );
  });

  it('returns empty postType and typeLabel when post.type is empty or invalid', () => {
    const rawPosts = [
      makeRawPost(0, { type: '' }),
      makeRawPost(1, { type: null }),
      makeRawPost(2, { type: 'announcement' }),
      makeRawPost(3, { type: undefined })
    ];

    const result = buildNewsViewModel(rawPosts, 'id', makeTranslator(ID_DICT));
    for (const item of result.items) {
      assert.equal(item.postType, '');
      assert.equal(item.typeLabel, '');
    }
  });

  it('passes limit: 6 to postModel.findAll in getHomePageData', async (t) => {
    t.after(() => mock.restoreAll());

    mock.method(bannerModel, 'findAll', async () => []);
    mock.method(brandModel, 'findAll', async () => []);
    const postSpy = mock.method(postModel, 'findAll', async () => [
      makeRawPost(0, { type: 'pers' })
    ]);
    mock.method(homeContentModel, 'getHomeContentData', async () => homeContentModel.getDefaults());
    mock.method(productCategoryModel, 'getHomepageCategories', async () => []);

    const viewModel = await getHomePageData({ currentLang: 'id', t: makeTranslator(ID_DICT) });

    assert.equal(postSpy.mock.callCount(), 1);
    assert.deepEqual(postSpy.mock.calls[0].arguments[0], { status: 'published', limit: 6 });
    assert.equal(viewModel.news.items.length, 1);
    assert.equal(viewModel.news.items[0].postType, 'pers');
    assert.equal(viewModel.news.items[0].typeLabel, 'Siaran Pers');
  });
});
