(function() {
    var canvas = document.getElementById('gridBg');
    var ctx = canvas.getContext('2d');
    var cursorGlow = document.getElementById('cursorGlow');
    var rippleContainer = document.getElementById('rippleContainer');
    var scrollY = 0;
    var mouseX = -500;
    var mouseY = -500;
    var smoothMouseX = -500;
    var smoothMouseY = -500;
    var time = 0;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('scroll', function() {
        scrollY = window.pageYOffset;
        document.getElementById('header').classList.toggle('scrolled', scrollY > 20);
    });

    window.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });

    document.addEventListener('click', function(e) {
        var ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        rippleContainer.appendChild(ripple);
        ripple.addEventListener('animationend', function() { ripple.remove(); });
    });

    document.querySelectorAll('.feature-card').forEach(function(card) {
        card.addEventListener('mousemove', function(e) {
            var rect = card.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.background = 'radial-gradient(circle at ' + x + '% ' + y + '%, rgba(90,60,140,0.06), rgba(255,255,255,0.015))';
        });
        card.addEventListener('mouseleave', function() { card.style.background = 'rgba(255,255,255,0.015)'; });
    });

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        smoothMouseX += (mouseX - smoothMouseX) * 0.08;
        smoothMouseY += (mouseY - smoothMouseY) * 0.08;
        var spacing = 65;
        var oX = (smoothMouseX - canvas.width / 2) * 0.012;
        var oY = (smoothMouseY - canvas.height / 2) * 0.012;
        var sOff = scrollY * 0.25;
        ctx.strokeStyle = 'rgba(55, 35, 90, 0.04)';
        ctx.lineWidth = 1;
        for (var x = -spacing; x <= canvas.width + spacing; x += spacing) {
            var w = Math.sin((x + time * 20) * 0.007) * 6;
            ctx.beginPath(); ctx.moveTo(x + oX + w, 0); ctx.lineTo(x + oX + w, canvas.height); ctx.stroke();
        }
        for (var y = -spacing; y <= canvas.height + spacing; y += spacing) {
            var aY = ((y - sOff % spacing) + spacing) % (canvas.height + spacing * 2) - spacing;
            var w2 = Math.sin((aY + time * 15) * 0.007) * 6;
            ctx.beginPath(); ctx.moveTo(0, aY + oY + w2); ctx.lineTo(canvas.width, aY + oY + w2); ctx.stroke();
        }
        for (var x2 = -spacing; x2 <= canvas.width + spacing; x2 += spacing) {
            for (var y2 = -spacing; y2 <= canvas.height + spacing; y2 += spacing) {
                var aY2 = ((y2 - sOff % spacing) + spacing) % (canvas.height + spacing * 2) - spacing;
                var wX = Math.sin((x2 + time * 20) * 0.007) * 6;
                var wY = Math.sin((aY2 + time * 15) * 0.007) * 6;
                var px = x2 + oX + wX;
                var py = aY2 + oY + wY;
                var d = Math.sqrt((px - smoothMouseX) * (px - smoothMouseX) + (py - smoothMouseY) * (py - smoothMouseY));
                var g = Math.max(0, 1 - d / 160);
                if (g > 0) {
                    ctx.beginPath(); ctx.arc(px, py, 1.2 + g * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(80, 55, 130, ' + (0.06 + g * 0.35) + ')'; ctx.fill();
                } else {
                    ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(55, 35, 90, 0.07)'; ctx.fill();
                }
            }
        }
        time += 0.016;
        requestAnimationFrame(drawGrid);
    }
    drawGrid();

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-anim]').forEach(function(el, i) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.7s cubic-bezier(0.175,0.885,0.32,1.275) ' + ((i % 3) * 0.12) + 's';
        observer.observe(el);
    });

    document.querySelectorAll('[data-tilt]').forEach(function(card) {
        card.addEventListener('mousemove', function(e) {
            var rect = card.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = 'translateY(-8px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
        });
        card.addEventListener('mouseleave', function() { card.style.transform = 'translateY(0) rotateY(0) rotateX(0)'; });
    });

    var statsAnimated = false;
    var statsObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                document.querySelectorAll('.stat-num').forEach(function(el) {
                    var target = parseInt(el.dataset.target);
                    var suffix = el.dataset.suffix || '';
                    var duration = 1500;
                    var startTime = Date.now();
                    var tick = function() {
                        var elapsed = Date.now() - startTime;
                        var progress = Math.min(elapsed / duration, 1);
                        var eased = 1 - Math.pow(1 - progress, 3);
                        el.textContent = Math.floor(target * eased).toLocaleString() + suffix;
                        if (progress < 1) requestAnimationFrame(tick);
                    };
                    tick();
                });
            }
        });
    }, { threshold: 0.3 });
    statsObs.observe(document.getElementById('statsStrip'));

    var navLinks = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', function() {
        var current = '';
        document.querySelectorAll('#home, #features, #project, #community').forEach(function(sec) {
            if (window.pageYOffset >= sec.offsetTop - 200) current = sec.id;
        });
        navLinks.forEach(function(link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) link.classList.add('active');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var headerHeight = 56;
                window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - headerHeight, behavior: 'smooth' });
            }
        });
    });

    setInterval(function() {
        var cursor = document.querySelector('.typing-cursor');
        if (cursor) cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }, 530);

    var lastScroll = 0;
    window.addEventListener('scroll', function() {
        var header = document.getElementById('header');
        var current = window.pageYOffset;
        if (current > lastScroll && current > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScroll = current;
    });

    var DISCORD_USER_ID = '1158040908579733646';
    var SURFACE_BG = '#0c0a14';
    var ws = null;
    var heartbeatInterval = null;
    var activityStartTime = null;
    var spotifyTimestamps = null;

    var statusSvgTemplates = {
        online: '<circle cx="8" cy="8" r="8" fill="#3ba55d"/>',
        idle: '<circle cx="8" cy="8" r="8" fill="#f0b232"/><circle cx="3.5" cy="3.5" r="5" fill="' + SURFACE_BG + '"/>',
        dnd: '<circle cx="8" cy="8" r="8" fill="#f23f43"/><rect x="3.5" y="6.5" width="9" height="3" rx="1.5" fill="' + SURFACE_BG + '"/>',
        offline: '<circle cx="8" cy="8" r="8" fill="#80848e"/><circle cx="8" cy="8" r="4" fill="' + SURFACE_BG + '"/>'
    };

    var statusLabels = {
        online: 'Online',
        idle: 'Idle',
        dnd: 'Do Not Disturb',
        offline: 'Offline'
    };

    function formatTime(ms) {
        var s = Math.floor(ms / 1000);
        var m = Math.floor(s / 60);
        s = s % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function formatElapsed(startMs) {
        var elapsed = Date.now() - startMs;
        if (elapsed < 0) elapsed = 0;
        var s = Math.floor(elapsed / 1000);
        var m = Math.floor(s / 60);
        var h = Math.floor(m / 60);
        s = s % 60;
        m = m % 60;
        if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + ' elapsed';
        return m + ':' + (s < 10 ? '0' : '') + s + ' elapsed';
    }

    function updatePresence(data) {
        var user = data.discord_user;
        var status = data.discord_status || 'offline';
        var activities = data.activities || [];
        var spotify = data.spotify;
        var listeningToSpotify = data.listening_to_spotify;

        if (user) {
            if (user.avatar) document.getElementById('dpAvatar').src = user.avatar;
            document.getElementById('dpDisplayName').textContent = user.global_name || user.username || 'Unknown';
            document.getElementById('dpUsername').textContent = user.username || '';
        }

        if (user && user.banner) {
            document.getElementById('dpBanner').innerHTML = '<img src="' + user.banner + '" alt="Banner" draggable="false"><div class="dp-banner-overlay"></div>';
        }

        document.getElementById('dpStatusSvg').innerHTML = statusSvgTemplates[status] || statusSvgTemplates.offline;
        document.getElementById('dpStatusDot').className = 'dp-status-dot ' + status;
        document.getElementById('dpStatusLabel').textContent = statusLabels[status] || 'Offline';

        var customStatus = activities.find(function(a) { return a.type === 4; });
        var customSection = document.getElementById('dpCustomStatus');
        if (customStatus && (customStatus.state || customStatus.emoji)) {
            customSection.style.display = 'flex';
            var emojiEl = document.getElementById('dpCustomEmoji');
            if (customStatus.emoji) {
                if (customStatus.emoji.id) {
                    emojiEl.innerHTML = '<img src="https://cdn.discordapp.com/emojis/' + customStatus.emoji.id + '.webp?size=20" alt="">';
                } else {
                    emojiEl.textContent = customStatus.emoji.name || '';
                }
            } else {
                emojiEl.textContent = '';
            }
            document.getElementById('dpCustomText').textContent = customStatus.state || '';
        } else {
            customSection.style.display = 'none';
        }

        var nonCustomActivities = activities.filter(function(a) { return a.type !== 4 && a.type !== 2; });
        var actSection = document.getElementById('dpActivitySection');

        if (nonCustomActivities.length > 0) {
            var act = nonCustomActivities[0];
            actSection.style.display = 'block';

            var headerMap = { 0: 'PLAYING A GAME', 1: 'STREAMING', 3: 'WATCHING', 5: 'COMPETING' };
            document.getElementById('dpActivityHeader').textContent = headerMap[act.type] || 'ACTIVITY';
            document.getElementById('dpActivityName').textContent = act.name || '';

            var detailsEl = document.getElementById('dpActivityDetails');
            var stateEl = document.getElementById('dpActivityState');
            detailsEl.textContent = act.details || '';
            detailsEl.style.display = act.details ? 'block' : 'none';
            stateEl.textContent = act.state || '';
            stateEl.style.display = act.state ? 'block' : 'none';

            var imgWrap = document.getElementById('dpActivityImages');
            var largeImg = document.getElementById('dpActivityLarge');
            var smallImg = document.getElementById('dpActivitySmall');

            if (act.assets && act.assets.large_image) {
                imgWrap.style.display = 'block';
                largeImg.src = act.assets.large_image;
                if (act.assets.small_image) {
                    smallImg.src = act.assets.small_image;
                    smallImg.style.display = 'block';
                } else {
                    smallImg.style.display = 'none';
                }
            } else {
                imgWrap.style.display = 'none';
            }

            if (act.timestamps && act.timestamps.start) {
                activityStartTime = act.timestamps.start;
            } else {
                activityStartTime = null;
                document.getElementById('dpActivityTime').textContent = '';
            }
        } else {
            actSection.style.display = 'none';
            activityStartTime = null;
        }

        var spotSection = document.getElementById('dpSpotifySection');
        if (listeningToSpotify && spotify) {
            spotSection.style.display = 'block';
            document.getElementById('dpSpotifySong').textContent = spotify.song || '';
            document.getElementById('dpSpotifyArtist').textContent = spotify.artist ? 'by ' + spotify.artist : '';
            document.getElementById('dpSpotifyAlbum').textContent = spotify.album || '';

            if (spotify.album_art_url) {
                document.getElementById('dpSpotifyArt').src = spotify.album_art_url;
                document.getElementById('dpSpotifyArt').style.display = 'block';
            } else {
                document.getElementById('dpSpotifyArt').style.display = 'none';
            }

            if (spotify.timestamps && spotify.timestamps.start && spotify.timestamps.end) {
                spotifyTimestamps = spotify.timestamps;
                document.getElementById('dpSpotifyBarWrap').style.display = 'flex';
            } else {
                spotifyTimestamps = null;
                document.getElementById('dpSpotifyBarWrap').style.display = 'none';
            }
        } else {
            spotSection.style.display = 'none';
            spotifyTimestamps = null;
        }
    }

    setInterval(function() {
        if (activityStartTime) {
            document.getElementById('dpActivityTime').textContent = formatElapsed(activityStartTime);
        }
        if (spotifyTimestamps) {
            var now = Date.now();
            var progress = now - spotifyTimestamps.start;
            var duration = spotifyTimestamps.end - spotifyTimestamps.start;
            if (progress < 0) progress = 0;
            if (progress > duration) progress = duration;
            var pct = duration > 0 ? (progress / duration) * 100 : 0;
            document.getElementById('dpSpotifyBarFill').style.width = pct + '%';
            document.getElementById('dpSpotifyTimeLeft').textContent = formatTime(progress);
            document.getElementById('dpSpotifyTimeRight').textContent = formatTime(duration);
        }
    }, 1000);

    function fetchPresence() {
        fetch('https://api.marki.my/v1/users/' + DISCORD_USER_ID)
            .then(function(r) { return r.json(); })
            .then(function(res) { if (res.success) updatePresence(res.data); })
            .catch(function() {});
    }

    function connectWebSocket() {
        try {
            ws = new WebSocket('wss://api.marki.my/socket');
            ws.onopen = function() {
                ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
            };
            ws.onmessage = function(event) {
                try {
                    var msg = JSON.parse(event.data);
                    if (msg.op === 1 && msg.d && msg.d.heartbeat_interval) {
                        if (heartbeatInterval) clearInterval(heartbeatInterval);
                        heartbeatInterval = setInterval(function() {
                            if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
                        }, msg.d.heartbeat_interval);
                    }
                    if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
                        if (msg.d) updatePresence(msg.d);
                    }
                } catch (e) {}
            };
            ws.onclose = function() {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                setTimeout(connectWebSocket, 5000);
            };
            ws.onerror = function() { ws.close(); };
        } catch (e) {
            setTimeout(connectWebSocket, 5000);
        }
    }

    fetchPresence();
    connectWebSocket();
})();

function smoothNav(target) {
    var el = document.querySelector(target);
    if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 56, behavior: 'smooth' });
    }
}

function showToast(msg) {
    var toast = document.getElementById('toast');
    toast.querySelector('.toast-text').textContent = msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        showToast('Copied to clipboard');
        setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
}

function copyCode(btn) {
    var activeTab = document.querySelector('.terminal-tab.active');
    var text = '';
    if (activeTab.id === 'tab-require') text = 'require(placeholderid)';
    else if (activeTab.id === 'tab-example') text = "local ss = require(placeholderid)\nss:Execute(\"print('hello')\")";
    else text = 'Xploit SS loaded successfully\nConnected to server\nReady for execution...';
    navigator.clipboard.writeText(text).then(function() {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg> Copied!';
        btn.classList.add('copied');
        showToast('Code copied to clipboard');
        setTimeout(function() {
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy';
            btn.classList.remove('copied');
        }, 2000);
    });
}

function switchTab(tab, btn) {
    document.querySelectorAll('.terminal-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('tab-' + tab).classList.add('active');
    btn.classList.add('active');
}