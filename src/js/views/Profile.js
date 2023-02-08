import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { createRef } from 'preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Button from '../components/basic/Button';
import BlockButton from '../components/BlockButton';
import CopyButton from '../components/CopyButton';
import Dropdown from '../components/Dropdown';
import FeedMessageForm from '../components/FeedMessageForm';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import MessageFeed from '../components/MessageFeed';
import Name from '../components/Name';
import ProfilePicture from '../components/ProfilePicture';
import ReportButton from '../components/ReportButton';
import Helpers from '../Helpers';
//import QRCode from '../lib/qrcode.min';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import View from './View';

class Profile extends View {
  constructor() {
    super();
    this.state = {
      followedUserCount: 0,
      followerCount: 0,
    };
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = 'profile';
    this.qrRef = createRef();
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(iris.session.getPubKey())) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>Share your profile link so ${this.state.name || 'this user'} can follow you:</p>
            <p>
              <${CopyButton}
                text=${t('copy_link')}
                title=${iris.session.getMyName()}
                copyStr=${Helpers.getProfileLink(iris.session.getPubKey())}
              />
            </p>
            <small>${t('visibility')}</small>
          </div>
        </div>
      `;
    }
  }

  renderLinks() {
    return html`
      <div
        class="profile-links"
        style="flex:1; display: flex; flex-direction: row; align-items: center;"
      >
        ${this.state.lud16
          ? html`
              <div style="flex:1">
                <a href=${this.state.lud16}>⚡ ${t('tip_lightning')}</a>
              </div>
            `
          : ''}
        ${this.state.website
          ? html`
              <div style="flex:1">
                <a href=${this.state.website}>
                  ${this.state.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            `
          : ''}
      </div>
    `;
  }

  renderDetails() {
    if (!this.state.hexPub) {
      return '';
    }
    let profilePicture;
    if (this.state.picture && !this.state.blocked) {
      profilePicture = html`<${ProfilePicture}
        key="${this.state.hexPub}picture"
        picture=${this.state.picture}
      />`;
    } else {
      profilePicture = html`<${Identicon}
        key=${this.state.hexPub}
        str=${this.state.hexPub}
        hidePicture=${true}
        width="250"
      />`;
    }
    let rawDataJson = JSON.stringify(
      Nostr.profileEventByUser.get(this.state.hexPub) || 'no profile :D',
      null,
      2,
    );
    rawDataJson = `${rawDataJson}\n\n${JSON.stringify(
      Nostr.followEventByUser.get(this.state.hexPub) || 'no contacts :D',
      null,
      2,
    )}`;
    return html`
      <div class="profile-top" key="${this.state.hexPub}details">
        <div class="profile-header">
          <div class="profile-picture-container">${profilePicture}</div>
          <div class="profile-header-stuff">
            <div style="display:flex; flex-direction:row;">
              <h3 style="flex: 1" class="profile-name">
                <${Name} pub=${this.state.hexPub} />
              </h3>
              <div class="profile-actions">
                <${Dropdown}>
                  ${this.state.isMyProfile
                    ? html`<${Button} onClick=${() => route('/profile/edit')}
                        >${t('edit_profile')}<//
                      >`
                    : ''}
                  <${CopyButton}
                    key=${`${this.state.hexPub}copyLink`}
                    text=${t('copy_link')}
                    title=${this.state.name}
                    copyStr=${window.location.href}
                  />
                  <${CopyButton}
                    key=${`${this.state.hexPub}copyNpub`}
                    text=${t('copy_user_ID')}
                    title=${this.state.name}
                    copyStr=${this.state.hexPub}
                  />
                  <!-- <${Button} onClick=${() => $(this.qrRef.current).toggle()}
                    >${t('show_qr_code')}<//
                  > -->
                  <${CopyButton}
                    key=${`${this.state.hexPub}copyData`}
                    text=${t('copy_raw_data')}
                    title=${this.state.name}
                    copyStr=${rawDataJson}
                  />
                  ${this.state.isMyProfile
                    ? ''
                    : html`
                        <${BlockButton} id=${this.state.hexPub} />
                        <${ReportButton} id=${this.state.hexPub} />
                      `}
                <//>
              </div>
            </div>

            ${this.state.nip05
              ? html`<div class="positive">${this.state.nip05.replace(/^_@/, '')}</div>`
              : ''}

            <div class="profile-about hidden-xs">
              <p class="profile-about-content">${this.state.about}</p>
              ${this.renderLinks()}
            </div>
            <div class="profile-actions">
              <div class="follow-count">
                <a href="/follows/${this.state.hexPub}">
                  <span>${this.state.followedUserCount}</span> ${t('following')}
                </a>
                <a href="/followers/${this.state.hexPub}">
                  <span>${this.state.followerCount}</span> ${t('followers')}
                </a>
              </div>
              ${Nostr.followedByUser
                .get(this.state.hexPub)
                ?.has(iris.session.getKey().secp256k1.rpub)
                ? html` <p><small>${t('follows_you')}</small></p> `
                : ''}
              <div class="hidden-xs">
                ${!this.state.isMyProfile
                  ? html`
                      <${FollowButton}
                        key=${`${this.state.hexPub}follow`}
                        id=${this.state.hexPub}
                      />
                    `
                  : ''}
                <${Button} small=${true} onClick=${() => route(`/chat/${this.state.hexPub}`)}>
                  ${t('send_message')}
                <//>
              </div>
            </div>
          </div>
        </div>

        <div class="visible-xs-flex profile-actions" style="justify-content: flex-end">
          ${this.renderLinks()}
          ${this.state.isMyProfile
            ? ''
            : html`
                <div>
                  <${FollowButton} key=${`${this.state.hexPub}follow`} id=${this.state.hexPub} />
                  <${Button} small=${true} onClick=${() => route(`/chat/${this.state.hexPub}`)}>
                    ${t('send_message')}
                  <//>
                </div>
              `}
        </div>
        ${this.state.about
          ? html`
              <div class="profile-about visible-xs-flex">
                <p class="profile-about-content">${this.state.about}</p>
              </div>
            `
          : ''}

        <p ref=${this.qrRef} style="display:none" class="qr-container"></p>
      </div>
    `;
  }

  renderTabs() {
    return html`
      <div class="tabs">
        <${Link} activeClassName="active" href="/${this.state.hexPub}"
          >${t('posts')} ${this.state.noPosts ? '(0)' : ''}<//
        >
        <${Link} activeClassName="active" href="/replies/${this.state.hexPub}"
          >${t('replies')} ${this.state.noReplies ? '(0)' : ''}<//
        >
        <${Link} activeClassName="active" href="/likes/${this.state.hexPub}"
          >${t('likes')} ${this.state.noLikes ? '(0)' : ''}<//
        >
      </div>
    `;
  }

  renderTab() {
    if (!this.state.hexPub) {
      return html`<div></div>`;
    }
    if (this.props.tab === 'replies') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="replies${this.state.hexPub}"
            index="postsAndReplies"
            nostrUser=${this.state.hexPub}
          />
        </div>
      `;
    } else if (this.props.tab === 'likes') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="likes${this.state.hexPub}"
            index="likes"
            nostrUser=${this.state.hexPub}
          />
        </div>
      `;
    } else if (this.props.tab === 'media') {
      return html`TODO media message feed`;
    }
    const messageForm = this.state.isMyProfile
      ? html`<${FeedMessageForm} class="hidden-xs" autofocus=${false} />`
      : '';

    return html`
      <div>
        ${messageForm}
        <div class="public-messages-view">
          ${this.getNotification()}
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="posts${this.state.hexPub}"
            index="posts"
            nostrUser=${this.state.hexPub}
          />
        </div>
      </div>
    `;
  }

  onNftImgError(e) {
    e.target.style = 'display:none';
  }

  renderView() {
    if (!this.state.hexPub) {
      return html`<div></div>`;
    }
    const title = this.state.name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${this.state.name || 'user'}. ${this.state.about || ''}`;
    return html`
      ${this.state.banner
        ? html`
            <div
              class="profile-banner"
              style="background-image:linear-gradient(
    to bottom, transparent, var(--main-color)
  ), url(${this.state.banner})"
            ></div>
          `
        : ''}
      <div class="content">
        <${Helmet}>
          <title>${title}</title>
          <meta name="description" content=${description} />
          <meta property="og:type" content="profile" />
          ${this.state.picture
            ? html`<meta property="og:image" content=${this.state.picture} />`
            : ''}
          <meta property="og:title" content=${ogTitle} />
          <meta property="og:description" content=${description} />
        <//>
        ${this.renderDetails()} ${this.state.blocked ? '' : this.renderTabs()}
        ${this.state.blocked ? '' : this.renderTab()}
      </div>
    `;
  }

  getNostrProfile(address) {
    Nostr.sendSubToRelays([{ authors: [address] }], address, true, 15 * 1000);
    const setFollowCounts = () => {
      address &&
        this.setState({
          followedUserCount: Nostr.followedByUser.get(address)?.size ?? 0,
          followerCount: Nostr.followersByUser.get(address)?.size ?? 0,
        });
    };
    Nostr.getFollowersByUser(address, setFollowCounts);
    Nostr.getFollowedByUser(address, setFollowCounts);
    Nostr.getProfile(
      address,
      (profile, addr) => {
        console.log('got profile', profile, addr);
        if (!profile || addr !== this.state.hexPub) return;
        let lud16 = profile.lud16;
        if (lud16 && !lud16.startsWith('lightning:')) {
          lud16 = 'lightning:' + lud16;
        }

        let website =
          profile.website &&
          (profile.website.match(/^https?:\/\//) ? profile.website : 'http://' + profile.website);
        // remove trailing slash
        if (website && website.endsWith('/')) {
          website = website.slice(0, -1);
        }

        let banner;

        try {
          banner = profile.banner && new URL(profile.banner).toString();
        } catch (e) {
          console.log('Invalid banner URL', profile.banner);
        }

        // profile may contain arbitrary fields, so be careful
        this.setState({
          name: profile.name,
          about: profile.about,
          picture: profile.picture,
          nip05: profile.nip05valid && profile.nip05,
          lud16,
          website: website,
          banner,
        });
      },
      true,
    );
  }

  loadProfile(hexPub) {
    this.setState({ hexPub });
    const isMyProfile = hexPub === iris.session.getKey().secp256k1.rpub;
    this.setState({ isMyProfile });
    this.followedUsers = new Set();
    this.followers = new Set();
    iris.local().get('noFollowers').on(this.inject());
    this.getNostrProfile(hexPub);
    /*
    let qrCodeEl = $(this.qrRef.current);
    qrCodeEl.empty();
    qrCodeEl.empty();
    new QRCode(qrCodeEl.get(0), {
      text: window.location.href,
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
    */
    Nostr.getBlockedUsers((blockedUsers) => {
      this.setState({ blocked: blockedUsers.has(hexPub) });
    });
  }

  componentDidMount() {
    this.restoreScrollPosition();
    const pub = this.props.id;
    const npub = Nostr.toNostrBech32Address(pub, 'npub');
    if (npub && npub !== pub) {
      route(`/${npub}`, true);
      return;
    }
    const hexPub = Nostr.toNostrHexAddress(pub);
    if (!hexPub) {
      // id is not a nostr address, but maybe it's a username
      let username = pub;
      if (!username.match(/.+@.+\..+/)) {
        username = username + '@iris.to';
      }
      Nostr.getPubKeyByNip05Address(username).then((pubKey) => {
        if (pubKey) {
          const npub = Nostr.toNostrBech32Address(pubKey, 'npub');
          if (npub && npub !== pubKey) {
            this.setState({ npub, hexPub: pubKey });
            this.loadProfile(pubKey);
          }
        } else {
          this.setState({ notFound: true });
        }
      });
      return;
    }
    this.loadProfile(hexPub);
  }
}

export default Profile;
