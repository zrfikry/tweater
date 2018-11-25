class API {
  constructor () {
    const API_URL = {
      rais: 'https://ecosystem-api.herokuapp.com',
      indra: 'https://little-ecosystem.glitch.me'
    }
    this.backend = 'rais'
    this.URL = API_URL[this.backend]
  }

  async getEcosystem () {
    return await fetch(`${ this.URL }/ecosystem`)
                  .then((res) => res.json().then(({data}) => data || []).catch(() => {}))
                  .catch((err) => console.error(err))
  }

  async getFeeds () {
    return await fetch(`${ this.URL }/ecosystem/feeds`)
                  .then((res) => res.json().then(({data}) => data || []).catch(() => {}))
                  .catch((err) => console.error(err))
  }

  async postTweat(perdator_id, target_id) {
    return await fetch(`${ this.URL }/ecosystem/${ perdator_id }/feeds`, {
      method: 'POST',
      mode: 'cors',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_id }),
    }).then((res) => res.json().then((data) => data).catch(() => {}))
    .catch((err) => console.error(err))
  }

  async replyTweat(species_id, feed_id, content) {
    return await fetch(`${ this.URL }/ecosystem/${ species_id }/${ feed_id }/reply`, {
      method: 'POST',
      mode: 'cors',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    }).then((res) => res.json().then((data) => data).catch(() => {}))
    .catch((err) => console.error(err))
  }

  async getThread(feed_id) {
    return fetch(`${ this.URL }/ecosystem/feeds/${ feed_id }`)
            .then((res) => res.json().then(({data}) => data || []).catch(() => {}))
            .catch((err) => console.error(err))
  }

  async getProfile(user_id) {
    return fetch(`${ this.URL }/ecosystem/${ user_id }`)
            .then((res) => res.json().then(({data}) => data || []).catch(() => {}))
            .catch((err) => console.error(err))
  }
}
const api = new API

class Modal {
  constructor(id) {
    this.mainElem = document.createElement('div')
    this.mainElem.id = id
    this.mainElem.className = 'modal'
    this.content = null
  }

  setContent(content) {
    this.content = content
    this.render()
  }

  showModal() {
    this.render()
  }

  closeModal() {
    this.mainElem.remove()
  }

  render() {
    const modalContent = document.createElement('div')
    modalContent.classList.add('modal-content')
    modalContent.id = `content-${this.mainElem.id}`
    modalContent.innerHTML = ''
    if (this.content) {
      modalContent.appendChild(this.content)
    }
    this.mainElem.innerHTML = ''
    this.mainElem.appendChild(modalContent)
    this.mainElem.onclick = (ev) => {
      if (ev.target === this.mainElem) {
        this.closeModal()
      }
    }
    document.body.appendChild(this.mainElem)
  }
}

class FeedItem {
  constructor (data = null, setting, afterReply = []) {
    this.data = data
    this.afterReply = [
      APP, ...afterReply
    ]
    this.setting = {
      onlyContent: false,
      hideReference: false,
      ...setting
    }
    this.modal = new Modal(`reply-${data ? data.id : '-'}`)
  }

  async sendReply (content) {
    let result = await api.replyTweat(APP.state.currentUser.id, this.data.id, content)
    if (!result.success) {
      alert('Reply fail!')
    } else {
      this.modal.closeModal()
      this.afterReply.forEach((func) => func.init())
    }
    return result
  }

  openReplyForm(refData) {
    let newForm = document.createElement('form')
    newForm.classList.add('reply-form')

    let header = document.createElement('h2')
    header.innerHTML = `Replying Feed`
    newForm.appendChild(header)

    let reference = new FeedItem(refData, { onlyContent: true })
    newForm.appendChild(reference.render())

    let newTextArea = document.createElement('textarea')
    newTextArea.id = 'replyContent'
    newTextArea.required = true
    newTextArea.placeholder = 'Reply text ...'
    newTextArea.autofocus = true

    newForm.appendChild(newTextArea)
    newForm.onsubmit = (ev) => {
      ev.preventDefault()
      const content = document.getElementById(newTextArea.id).value
      this.sendReply(content)
    }

    let cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.innerText = 'Cancel'
    cancelBtn.type = 'button'
    cancelBtn.onclick = () => this.modal.closeModal()
    newForm.appendChild(cancelBtn)

    let replyBtn = document.createElement('button')
    replyBtn.className = 'btn'
    replyBtn.innerText = '↪ Reply'
    replyBtn.type = 'submit'
    replyBtn.onclick = () => {  }
    newForm.appendChild(replyBtn)

    this.modal.setContent(newForm)
    this.modal.showModal()
  }
  
  render() {
    let newItem = document.createElement('div')
    newItem.classList.add('feed-item')
    if (this.data !== null) {
      const user = APP.state.userList.find((u) => u.id === this.data.species_id) || null
      newItem.id = `feed-${this.data.id}`

      // the feed can be clicked
      newItem.onclick = (ev) => {
        if (ev.target.id === newItem.id || ev.target.parentNode.id === newItem.id) {
          new Thread(this.data.id)
        }
      }

      let leftBox = document.createElement('div')
      let rightBox = document.createElement('div')

      leftBox.appendChild(randomPic(user.name.substring(0,1)))

      let header = document.createElement('h2')
      let usernameElem = document.createElement('a')
      usernameElem.innerText = user.name || 'unknown'
      usernameElem.onclick = (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        new ProfileDetail(user.id)
      }
      let dateElem = document.createElement('span')
      dateElem.innerText = ` • ${ formatDate(new Date(this.data.time * 1000)) }`
      header.appendChild(usernameElem)
      header.appendChild(dateElem)
      rightBox.appendChild(header)

      // check if reply
      if (this.data.reference_id !== 0 && this.setting.onlyContent === false && this.setting.hideReference === false) {
        newItem.classList.add('reply')
        let replyTo = document.createElement('small')
        replyTo.innerText = `Replying to `
        let linkRef = document.createElement('a')
        linkRef.innerText = 'this feed'
        linkRef.setAttribute('data-ref', newItem.id)
        linkRef.onclick = (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          if (ev.target.dataset.ref === newItem.id) {
            new Thread(this.data.reference_id)
          }
        }
        replyTo.appendChild(linkRef)
        rightBox.appendChild(replyTo)
      }

      let content = document.createElement('p')
      let tweatContent = this.data.content.split(' ')
      let mentionedUser = removeDuplicateInArray(tweatContent.filter((word) => word[0] === '@'))
      if (mentionedUser.length > 0) {
        let newContent = this.data.content
        mentionedUser.forEach((item) => {
          let mentionedId = item.substring(1)
          let newMention = APP.state.userList.find((u) => u.id === Number(mentionedId)) || item
          let linkMention = document.createElement('a')
          linkMention.classList.add('mention')
          linkMention.setAttribute('data-id', newMention.id)
          linkMention.innerText = `@${newMention.name || 'unknown'}`
          newContent = newContent.replace(item, linkMention.outerHTML)
        })
        content.innerHTML = newContent
      } else {
        content.innerHTML = this.data.content
      }
      rightBox.appendChild(content)

      // reply button
      if (this.setting.onlyContent === false) {
        let replyBtn = document.createElement('a')
        replyBtn.classList.add('btn-link')
        replyBtn.innerText = '↪ Reply'
        replyBtn.onclick = (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          this.openReplyForm(this.data)
        }
        rightBox.appendChild(replyBtn)
      }

      if (this.setting.onlyContent === false) {
        newItem.appendChild(leftBox)
      }
      newItem.appendChild(rightBox)
    } else {
      newItem.classList.add('empty')
      newItem.innerText = `It's calm and peacefull 💩`
    }
    return newItem
  }
}

class Thread {
  constructor(feed_id) {
    this.state = {
      feed_id,
      data: {
        replies: []
      }
    }

    this.modal = new Modal('thread')
    this.init()
  }

  async getDetail() {
    let data = await api.getThread(this.state.feed_id)
    this.state = { ...this.state, data }
  }

  async init () {
    await this.getDetail()
    this.open(this.render())
  }

  open(el) {
    let anotherModals = document.querySelectorAll('.modal')
    anotherModals.forEach((el) => el.remove())
    this.modal.setContent(el)
    this.modal.showModal()
  }

  render() {
    let { data } = this.state
    let threadElem = document.createElement('div')
    threadElem.className = 'thread'

    // header
    let header = document.createElement('header')
    header.innerHTML = '<h2>Thread</h2>'
    threadElem.appendChild(header)

    // main feed
    let mainFeed = new FeedItem(data, {}, [this]).render()
    mainFeed.classList.add('main-feed')
    threadElem.appendChild(mainFeed)

    // replies
    if (data.replies.length > 0) {
      let repliesElem = document.createElement('div')
      repliesElem.className = 'replies'
      let lineElem = document.createElement('span')
      lineElem.className = 'line'
      let listElem = document.createElement('div')
      listElem.className= 'list'
      data.replies.forEach((reply) => {
        listElem.appendChild(new FeedItem(reply, { hideReference: true }, [this]).render())
      })
      repliesElem.appendChild(lineElem)
      repliesElem.appendChild(listElem)

      threadElem.appendChild(repliesElem)
    }
    return threadElem
  }
}

class ProfileDetail {
  constructor (user_id) {
    this.state = {
      user_id,
      data: {
        feeds: []
      }
    }

    this.modal = new Modal(`profile-${ user_id }`)
    this.init()
  }

  async getProfile() {
    let data = await api.getProfile(this.state.user_id)
    this.state = { ...this.state, data }
  }

  async init () {
    await this.getProfile()
    this.open(this.render())
  }

  open(el) {
    let anotherModals = document.querySelectorAll('.modal')
    anotherModals.forEach((el) => el.remove())
    this.modal.setContent(el)
    this.modal.showModal()
  }

  render() {
    let { data } = this.state
    let profileElem = document.createElement('div')
    profileElem.className = 'profile-detail'

    // header 
    let header = document.createElement('header')
    let initial = data.name[0] || '?'
    let profilePic = randomPic(initial, 'big')
    let fullName = document.createElement('h2')
    fullName.innerText = data.name || 'Unknown'
    header.appendChild(profilePic)
    header.appendChild(fullName)
    profileElem.appendChild(header)
    
    // feeds
    let feeds = document.createElement('div')
    feeds.className = 'profile-feeds'
    if (data.feeds.length > 0) {
      let lineElem = document.createElement('div')
      lineElem.className = 'line'
      let listElem = document.createElement('div')
      listElem.className = 'list'
      data.feeds.forEach((feed) => {
        listElem.appendChild(new FeedItem(feed, {}, [this]).render())
      })
      feeds.appendChild(lineElem)
      feeds.appendChild(listElem)
    } else {
      feeds.innerHTML = '<p class="empty"> - No Tweat - </p>'
    }
    
    profileElem.appendChild(feeds)
    return profileElem
  }
}

class MainApp {
  constructor () {
    this.state = {
      userList: [],
      feeds: [],
      currentUser: { id: null, name: '' }
    }
  }

  setState(data) {
    this.state = {...this.state, ...data}
    this.render()
  }

  async init() {
    this.render()
    let userList = await api.getEcosystem()
    let currentUser = this.state.currentUser.id === null ? userList[0] : this.state.currentUser
    let feeds = await api.getFeeds()
    this.setState({ userList, currentUser, feeds })
  }

  async postTweat (perdator_id, target_id) {
    let result = await api.postTweat(perdator_id, target_id)
    if (!result.success) {
      alert('Tweat fail!')
    } else {
      this.init()
    }
    return result
  }

  setCurrentUser(id) {
    let currentUser = this.state.userList.find((u) => u.id === Number(id)) || this.state.currentUser
    this.setState({ currentUser })
  }

  render() {
    // USER PICTURE
    const profileNameElem = document.getElementById('profileName')
    profileNameElem.innerHTML = ''
    let initial = String(this.state.currentUser.name).substring(0,1)
    profileNameElem.appendChild(randomPic(initial))

    // USER SELECT
    const userSelectElem = document.getElementById('userSelect')
    userSelectElem.onchange = (ev) => {
      const { value } = ev.target
      this.setCurrentUser(value)
    }
    userSelectElem.innerHTML = ''
    this.state.userList.forEach((u) => {
      let newOpt = document.createElement('option')
      newOpt.value = u.id
      newOpt.innerText = u.name
      if(this.state.currentUser.id === u.id) {
        newOpt.selected = true
      }
      userSelectElem.appendChild(newOpt)
    })

    // TARGET SELECT
    const targetTweatElem = document.getElementById('targetTweat')
    targetTweatElem.innerHTML = ''
    this.state.userList.forEach((u) => {
      let newOpt = document.createElement('option')
      newOpt.value = u.id
      newOpt.innerText = u.name
      targetTweatElem.appendChild(newOpt)
    })

    // TWEAT FORM
    const tweatForm = document.getElementById('tweatForm')
    tweatForm.onsubmit = (ev) => {
      ev.preventDefault()
      this.postTweat( this.state.currentUser.id, targetTweatElem.value )
    }

    // FEEDS
    const feedsElem = document.getElementById('mainFeeds')
    feedsElem.innerHTML = ''
    if (this.state.feeds.length > 0) {
      // render feeds
      this.state.feeds.forEach((feed) => {
        let newItem = new FeedItem(feed).render()
        feedsElem.appendChild(newItem)
      })
    } else {
      // empty placeholder
      let newItem = new FeedItem().render()
      feedsElem.appendChild(newItem)
    }
  }
  
}
const APP = new MainApp

window.onclick = (ev) => {
  if (ev.target.className.includes('mention')) {
    ev.stopPropagation()
    ev.stopImmediatePropagation()
    new ProfileDetail(ev.target.dataset.id)
  }
}

// UTILITIES ZONE
const formatDate = (date = new Date) => {
  let monthNames = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun", "Jul",
    "Aug", "Sep", "Oct",
    "Nov", "Dec"
  ];

  let day = date.getDate()
  let monthIndex = date.getMonth()
  let year = date.getFullYear()
  let hour = String("0" + date.getHours()).slice(-2)
  let min = String("0" + date.getMinutes()).slice(-2)

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + hour + ':' + min
}

const randomPic = (initial = '-', addClass) => {
  let newPic = document.createElement('div')
  newPic.className = 'initial-pic'
  newPic.classList.add(addClass)
  newPic.innerText = String(initial).toUpperCase()
  let rgb = []
  for (let i = 0; i < 3; i++) {
    rgb.push(Math.floor(Math.random() * 150) + 75)
  }
  newPic.style.background = `rgb(${rgb.join()})`
  return newPic
}

const removeDuplicateInArray = (arr) =>{
  let unique_array = Array.from(new Set(arr))
  return unique_array
}
