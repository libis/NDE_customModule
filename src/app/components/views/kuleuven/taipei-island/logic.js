/** @param {import('@libis/primo-alpine').AlpineType} Alpine */
export default function setup(Alpine) {
  Alpine.data('taipeiIsland', () => ({
    // $primo is primo-shared-state, read-only: $primo.search.totalResults -> primo.search.selectTotalResults$()
    get summary() {
      const total = this.$primo.search.totalResults ?? 0;
      const user = this.$primo.user.isLoggedIn ? 'signed in' : 'guest';
      return `${total} results, you are ${user}`;
    },
    get isLoading() {
      return this.$primo.search.isLoading;
    },
  }));
}
