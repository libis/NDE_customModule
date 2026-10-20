#!/usr/bin/env bash
# =============================================================================
#  demo-taipei.sh : live demo for "NDE customModule: learning a common language"
#  IGeLU Developers Day, Taipei
#
#  BEFORE THE TALK (at home, good network), from a clean NDE_customModule
#  checkout on branch LIBIS:
#
#      ./demo-taipei.sh                # all steps, pauses before each one
#      DEMO_AUTO=1 ./demo-taipei.sh    # all steps, no pauses
#      PUSH=1 ./demo-taipei.sh         # ... and push branch + tags to origin
#
#  Every step ends with a commit and a tag: taipei-1 ... taipei-5.
#
#  ON STAGE (no npm installs, no long builds):
#
#      ./demo-taipei.sh goto 3         # check out tag taipei-3
#      ./demo-taipei.sh start          # npm run start:islands
#      ./demo-taipei.sh list           # show the steps and their tags
#
#  Or use the VS Code tasks (Cmd+Shift+P > Run Task > "Taipei: ...").
#
#  Run one step again (you must be on branch taipei, previous steps done):
#
#      ./demo-taipei.sh step 3
#
#  The steps:
#    1. new branch "taipei", remove all existing components (and the old SearchEvent),
#       switch off the central package so only our view code runs
#    2. a status bar under the header: an @NDEComponent that reads host state through primo-shared-state
#    3. an @NDEEvent that times every search; the status bar shows the last search time
#    4. install primo-alpine and put a simple Alpine island (also primo-shared-state) in the status bar
#    5. build the view package
#
#  Components and islands go into src/app/components/views/$VIEW, so
#  `npm run start:proxy` serves them from the dev server and recompiles on save.
#
#  Options (environment variables):
#    PRIMO_ALPINE_DIR   where to find or clone libis/primo-alpine (default ../primo-alpine)
#    PRIMO_ALPINE_TGZ   use this tgz instead of building one
#    BRANCH             branch name (default taipei)
#    VIEW               view (nde.environments key) the demo code goes into (default kuleuven)
#    TAG_PREFIX         tag prefix (default taipei-)
# =============================================================================
set -euo pipefail

BRANCH="${BRANCH:-taipei}"
VIEW="${VIEW:-kuleuven}"
TAG_PREFIX="${TAG_PREFIX:-taipei-}"
PRIMO_ALPINE_DIR="${PRIMO_ALPINE_DIR:-../primo-alpine}"
PRIMO_ALPINE_REPO="https://github.com/libis/primo-alpine.git"
SCRIPT_NAME="demo-taipei.sh"

BOLD=$'\e[1m'; TEAL=$'\e[36m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; DIM=$'\e[2m'; RESET=$'\e[0m'

TITLES=(
  ""
  "Create branch '$BRANCH' and remove the existing components"
  "Generate a status bar @NDEComponent after the header"
  "Add an @NDEEvent that times every search and show it in the status bar"
  "Install primo-alpine and add an Alpine island to the status bar"
  "Build the $VIEW view package"
)

step()  { echo; echo "${BOLD}${TEAL}==> $*${RESET}"; }
info()  { echo "${DIM}    $*${RESET}"; }
ok()    { echo "${GREEN}    ✓ $*${RESET}"; }
warn()  { echo "${YELLOW}    ! $*${RESET}"; }
die()   { echo "${YELLOW}$*${RESET}" >&2; exit 1; }
pause() {
  if [[ -z "${DEMO_AUTO:-}" && -t 0 ]]; then
    read -r -p "    ${DIM}[enter] to continue${RESET} " _
  fi
}

# Commit whatever the step changed and (re)tag it, so the audience can `git checkout taipei-N`.
checkpoint() {
  local n="$1"
  git add -A
  git commit -q --allow-empty -m "Taipei demo step $n: ${TITLES[$n]}"
  git tag -f "${TAG_PREFIX}${n}" >/dev/null
  ok "commit + tag ${TAG_PREFIX}${n}"
}

check_repo() {
  [[ -f package.json && -d nde && -f src/app/decorators/nde-component.decorator.ts ]] \
    || die "Run this from the root of NDE_customModule (LIBIS flavour)."
}

check_clean() {
  # The script itself may be untracked before step 1.
  if [[ -n "$(git status --porcelain | grep -v " ${SCRIPT_NAME}\$" || true)" ]]; then
    die "Your working tree has changes. Commit or stash them first."
  fi
}

# --- 1. branch + clean slate ---------------------------------------------------
step_1() {
  step "1. ${TITLES[1]}"
  pause
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    die "Branch '$BRANCH' already exists. Delete it (git branch -D $BRANCH) or set BRANCH=..."
  fi
  git checkout -b "$BRANCH"
  git rm -r -q src/app/components/central
  mkdir -p src/app/components/central
  # The LIBIS SearchEvent also rewrites /pnxs responses; our demo event replaces it.
  git rm -q src/app/events/search.event.ts
  # No central package: the proxy answers CENTRAL_CODE.txt with 404, so only our view code runs.
  npm pkg set nde.centralPackage=false --json
  ok "src/app/components/central is empty, views/* keep their .gitkeep"
  ok "removed src/app/events/search.event.ts"
  ok "package.json: nde.centralPackage = false"
  write_vscode_tasks
  ok ".vscode/tasks.json: Taipei tasks added"
  checkpoint 1
}

# --- the status bar (rewritten by steps 2, 3 and 4, so each tag shows what that step adds) --
# write_status_bar <timer 0|1> <island 0|1>
write_status_bar() {
  local timer="$1" island="$2"
  local DIR="src/app/components/views/$VIEW/taipei-status-bar"
  mkdir -p "$DIR"

  {
    echo "import { Component, computed, inject } from '@angular/core';"
    echo "import { PrimoStateService } from '@libis/primo-shared-state';"
    echo "import { NDEComponent, NDE_SLOTS, NDE_POSITION } from 'src/app/decorators/nde-component.decorator';"
    [[ "$timer" == 1 ]] && echo "import { lastSearch } from 'src/app/events/search-timer.event';"
    [[ "$island" == 1 ]] && echo "import { TaipeiIslandIsland } from '../taipei-island/taipei-island.island.component';"
    cat <<'TS'

/**
 * Taipei demo: a status bar under the Primo header.
 *  - step 2: host state read through primo-shared-state
 *  - step 3: how long the last search took, measured by SearchTimerEvent (@NDEEvent)
 *  - step 4: an Alpine island (primo-alpine) inside the bar
 */
@NDEComponent({
  selector: NDE_SLOTS.HEADER,
  position: NDE_POSITION.AFTER,
  description: 'IGeLU Taipei demo status bar',
})
@Component({
  selector: 'custom-taipei-status-bar',
  standalone: true,
TS
    [[ "$island" == 1 ]] && echo "  imports: [TaipeiIslandIsland],"
    cat <<'TS'
  templateUrl: './taipei-status-bar.component.html',
  styleUrls: ['./taipei-status-bar.component.scss'],
})
export class TaipeiStatusBarComponent {
  private primo = inject(PrimoStateService);

  // Signals: no subscribe, no unsubscribe, no async pipe.
  readonly vid = this.primo.config.vidSignal();
  readonly isLoggedIn = this.primo.user.isLoggedInSignal();
  readonly total = this.primo.search.totalResultsSignal();
  readonly params = this.primo.search.searchParamsSignal();
  readonly query = computed(() => this.params()?.q ?? '');
TS
    [[ "$timer" == 1 ]] && echo "  readonly lastSearch = lastSearch;"
    echo "}"
  } > "$DIR/taipei-status-bar.component.ts"

  {
    cat <<'HTML'
<div class="taipei-status-bar">
  <section>
    <strong>你好 Taipei!</strong>
    <span>View: {{ vid() }}</span>
    <span>{{ isLoggedIn() ? 'Signed in' : 'Guest' }}</span>
    @if (query()) {
      <span>{{ total() }} results for "{{ query() }}"</span>
    }
  </section>
HTML
    [[ "$timer" == 1 ]] && cat <<'HTML'
  <section>
    @if (lastSearch(); as search) {
      <span>Last search took <strong>{{ search.ms }} ms</strong></span>
    } @else {
      <span>No search timed yet</span>
    }
  </section>
HTML
    [[ "$island" == 1 ]] && cat <<'HTML'
  <section>
    <custom-island-taipei-island></custom-island-taipei-island>
  </section>
HTML
    echo "</div>"
  } > "$DIR/taipei-status-bar.component.html"

  cat > "$DIR/taipei-status-bar.component.scss" <<'SCSS'
.taipei-status-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
  padding: 6px 16px;
  color: var(--mat-sys-on-primary-container);
  background: var(--mat-sys-primary-container);
  font: var(--sys-body-medium);

  section {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  section + section {
    padding-left: 24px;
    border-left: 1px solid currentColor;
  }
}
SCSS
}

# --- 2. a simple NDEComponent ----------------------------------------------------
step_2() {
  step "2. ${TITLES[2]}"
  pause
  npm run nde -- generate component taipei-status-bar --target header --position after --build_target "$VIEW"
  rm -f "src/app/components/views/$VIEW/taipei-status-bar/taipei-status-bar.component.spec.ts"
  write_status_bar 0 0
  ok "src/app/components/views/$VIEW/taipei-status-bar (uses primo.config, primo.user, primo.search)"
  checkpoint 2
}

# --- 3. a simple NDEEvent --------------------------------------------------------
step_3() {
  step "3. ${TITLES[3]}"
  pause
  cat > src/app/events/search-timer.event.ts <<'TS'
import { Injectable, signal } from '@angular/core';
import { NDEEvent, NDEEventBase } from '../decorators/nde-event.decorator';
import { GlobalHttpEventService } from '../services/global-http-event.service';
import { GlobalHttpEvent } from '../services/global-http-interceptor';

/** The last search: read by the status bar. */
export const lastSearch = signal<{ ms: number; at: Date } | null>(null);

/**
 * Taipei demo: times every search.
 * Layer 2 (onEvent) only observes: the global interceptor already measured the request,
 * every response event carries its duration.
 */
@Injectable()
@NDEEvent({
  stream: 'response',
  match: /\/primaws\/rest\/pub\/pnxs\?/,
  order: 10,
  description: 'Taipei demo: time every search',
})
export class SearchTimerEvent extends NDEEventBase {
  constructor(globalHttp: GlobalHttpEventService) {
    super(globalHttp);
  }

  override onEvent(event: GlobalHttpEvent): void {
    if (event.duration === undefined) return;
    const ms = Math.round(event.duration);
    lastSearch.set({ ms, at: new Date() });
    console.log(`[SearchTimerEvent] search took ${ms} ms`);
  }
}
TS
  write_status_bar 1 0
  ok "src/app/events/search-timer.event.ts (auto-registered, no provider to add)"
  ok "status bar shows the last search time"
  checkpoint 3
}

# --- 4. primo-alpine -------------------------------------------------------------
step_4() {
  step "4. ${TITLES[4]}"
  pause
  local TGZ=""
  if [[ -n "${PRIMO_ALPINE_TGZ:-}" ]]; then
    cp "$PRIMO_ALPINE_TGZ" nde/
    TGZ="nde/$(basename "$PRIMO_ALPINE_TGZ")"
  fi
  if [[ -z "$TGZ" ]]; then
    TGZ="$(ls nde/libis-primo-alpine-*.tgz 2>/dev/null | tail -n 1 || true)"
  fi
  if [[ -z "$TGZ" ]]; then
    info "primo-alpine is not on npm yet: building a tgz from GitHub"
    if [[ ! -d "$PRIMO_ALPINE_DIR" ]]; then
      git clone -q "$PRIMO_ALPINE_REPO" "$PRIMO_ALPINE_DIR"
    fi
    ( cd "$PRIMO_ALPINE_DIR" && npm install --no-audit --no-fund && npm run pack )
    local BUILT
    BUILT="$(ls "$PRIMO_ALPINE_DIR"/dist/libis-primo-alpine-*.tgz | tail -n 1)"
    cp "$BUILT" nde/
    TGZ="nde/$(basename "$BUILT")"
  fi
  info "using $TGZ"
  npm install --no-audit --no-fund --save-exact "./$TGZ" alpinejs@3.17.3

  # LIBIS flavour: islands become @NDEComponent classes inside src/app/components.
  npx primo-alpine init --registration nde-decorator

  # init leaves app.module alone in nde-decorator mode: add providePrimoAlpine() with its own helper.
  node -e "
    const { patchAppModule } = require(process.cwd() + '/node_modules/@libis/primo-alpine/cli/init.js');
    console.log('    app.module.ts:', patchAppModule('src/app/app.module.ts', process.cwd()));
  "
  # Regenerate islands before every build and dev server start.
  npm pkg set scripts.prebuild="primo-alpine codegen"
  npm pkg set scripts.prebuild:central="primo-alpine codegen"
  npm pkg set scripts.prestart:proxy="primo-alpine codegen && npm run prepare:serve"
  npm pkg set scripts.start:islands="primo-alpine dev -- npm run start:proxy"
  npm pkg set scripts.lint:islands="primo-alpine lint"
  ok "primo-alpine installed and wired"

  # The island lives inside the status bar, not in a Primo slot of its own:
  # its viewPattern never matches a vid, so it does not register itself.
  npx primo-alpine generate taipei-island --slot nde-header --position after --dir "views/$VIEW" --csp-safe
  local ISLAND="src/app/components/views/$VIEW/taipei-island"
  node -e "
    const f = '$ISLAND/island.json', fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
    cfg.viewPattern = '^embedded-in-the-status-bar\$';
    fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
  "

  # --csp-safe: logic lives in logic.js, the template only reads names.
  cat > "$ISLAND/template.html" <<'HTML'
<span class="taipei-island" x-data="taipeiIsland">
  <strong>Alpine:</strong>
  <span x-text="summary"></span>
  <span x-show="isLoading">Searching...</span>
</span>
HTML

  cat > "$ISLAND/logic.js" <<'JS'
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
JS

  npx primo-alpine codegen
  npx primo-alpine lint
  write_status_bar 1 1
  ok "$ISLAND (template.html + logic.js, generated taipei-island.island.component.ts)"
  ok "status bar embeds <custom-island-taipei-island>"
  checkpoint 4
}

# --- 5. build ----------------------------------------------------------------------
step_5() {
  step "5. ${TITLES[5]}"
  pause
  npm run build -- "$VIEW"
  checkpoint 5
}

# --- VS Code tasks (written in step 1, so every tag has them) ------------------------
write_vscode_tasks() {
  mkdir -p .vscode
  cat > .vscode/tasks.json <<'JSON'
{
  // For more information, visit: https://go.microsoft.com/fwlink/?LinkId=733558
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Taipei: go to step",
      "detail": "Check out tag taipei-N (installs packages when needed)",
      "type": "shell",
      "command": "./demo-taipei.sh goto ${input:taipeiStep}",
      "problemMatcher": [],
      "presentation": { "reveal": "always", "panel": "shared", "clear": true }
    },
    {
      "label": "Taipei: start proxy with islands",
      "detail": "npm run start:islands",
      "type": "shell",
      "command": "./demo-taipei.sh start",
      "isBackground": true,
      "problemMatcher": [],
      "presentation": { "reveal": "always", "panel": "dedicated" }
    },
    {
      "label": "Taipei: list steps",
      "type": "shell",
      "command": "./demo-taipei.sh list",
      "problemMatcher": [],
      "presentation": { "reveal": "always", "panel": "shared", "clear": true }
    },
    {
      "type": "npm",
      "script": "start",
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "pattern": "$tsc",
        "background": {
          "activeOnStart": true,
          "beginsPattern": { "regexp": "(.*?)" },
          "endsPattern": { "regexp": "bundle generation complete" }
        }
      }
    },
    {
      "type": "npm",
      "script": "test",
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "pattern": "$tsc",
        "background": {
          "activeOnStart": true,
          "beginsPattern": { "regexp": "(.*?)" },
          "endsPattern": { "regexp": "bundle generation complete" }
        }
      }
    }
  ],
  "inputs": [
    {
      "id": "taipeiStep",
      "type": "pickString",
      "description": "Which step?",
      "options": [
        { "label": "1 · clean slate", "value": "1" },
        { "label": "2 · @NDEComponent", "value": "2" },
        { "label": "3 · @NDEEvent", "value": "3" },
        { "label": "4 · primo-alpine island", "value": "4" },
        { "label": "5 · view built", "value": "5" }
      ],
      "default": "1"
    }
  ]
}
JSON
}

# --- stage commands ------------------------------------------------------------------
cmd_list() {
  for n in 1 2 3 4 5; do
    local tag="${TAG_PREFIX}${n}" mark="  "
    git rev-parse -q --verify "refs/tags/$tag" >/dev/null || mark="${YELLOW}? ${RESET}"
    echo "${mark}${BOLD}${tag}${RESET}  ${TITLES[$n]}"
  done
}

cmd_goto() {
  local n="${1:-}"
  [[ "$n" =~ ^[1-5]$ ]] || die "Usage: ./$SCRIPT_NAME goto <1-5>"
  local tag="${TAG_PREFIX}${n}"
  git rev-parse -q --verify "refs/tags/$tag" >/dev/null || die "Tag $tag not found. Run the steps (or git fetch --tags) first."
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    die "You have local changes. Commit, stash or discard them first (git stash)."
  fi
  local before after
  before="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
  git -c advice.detachedHead=false switch -q --detach "$tag"
  after="$(git rev-parse HEAD:package-lock.json 2>/dev/null || true)"
  if [[ "$before" != "$after" || ! -d node_modules ]]; then
    info "packages changed: npm install"
    npm install --no-audit --no-fund --prefer-offline >/dev/null
  fi
  step "Now at ${tag}: ${TITLES[$n]}"
  if [[ "$n" -gt 1 ]]; then
    info "changed in this step (also visible in VS Code: Source Control > Timeline, or compare with ${TAG_PREFIX}$((n - 1))):"
    git --no-pager diff --stat "${TAG_PREFIX}$((n - 1))" "$tag" -- . ':!package-lock.json' ':!nde/*.tgz' | sed 's/^/    /'
  fi
}

cmd_start() {
  if [[ -n "$(npm pkg get scripts.start:islands 2>/dev/null | tr -d '{}"\n ')" ]]; then
    npm run start:islands
  else
    warn "no primo-alpine yet at this step: npm run start:proxy"
    npm run start:proxy
  fi
}

push_if_asked() {
  if [[ -n "${PUSH:-}" ]]; then
    git push -u origin "$BRANCH"
    git push -f origin $(for n in 1 2 3 4 5; do printf 'refs/tags/%s%s ' "$TAG_PREFIX" "$n"; done)
    ok "pushed $BRANCH and tags ${TAG_PREFIX}1..5"
  fi
}

run_all() {
  check_clean
  [[ -d node_modules ]] || { step "npm install"; npm install --no-audit --no-fund; }
  step_1; step_2; step_3; step_4; step_5
  push_if_asked
  echo
  echo "${BOLD}Done.${RESET} On stage:  ./$SCRIPT_NAME goto 1   ...   ./$SCRIPT_NAME goto 5   then   ./$SCRIPT_NAME start"
  echo "      Start on the home page, search for anything and watch the status bar under the header"
  echo "      and the console: [NDEComponent] Registered ..., [SearchTimerEvent] search took ... ms"
  [[ -n "${PUSH:-}" ]] || echo "      Share it:  PUSH=1 ./$SCRIPT_NAME push"
}

main() {
  check_repo
  case "${1:-all}" in
    all)   run_all ;;
    step)  [[ "${2:-}" =~ ^[1-5]$ ]] || die "Usage: ./$SCRIPT_NAME step <1-5>"
           if [[ "$2" != 1 && "$(git branch --show-current)" != "$BRANCH" ]]; then
             die "Switch to branch $BRANCH first (git switch $BRANCH)."
           fi
           "step_$2" ;;
    goto)  cmd_goto "${2:-}" ;;
    start) cmd_start ;;
    list)  cmd_list ;;
    push)  PUSH=1 push_if_asked ;;
    -h|--help|help) sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//' ;;
    *)     die "Unknown command '$1'. Try: ./$SCRIPT_NAME help" ;;
  esac
}

# Everything runs from inside main, so bash has read the whole file before `goto`
# checks out a commit that may contain a different version of this script.
main "$@"; exit
