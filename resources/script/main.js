   
   
 const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const currentTheme = localStorage.getItem('theme') || 'dark';
    body.classList.add(currentTheme + '-theme');

    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
      body.classList.remove('dark-theme', 'light-theme');
      body.classList.add(newTheme + '-theme');
      localStorage.setItem('theme', newTheme);
      themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

    themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';

    const createLinkElement = (link, className = 'topic-link') => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      a.className = className;

      const styleStr = [
        link.textColor ? `color: ${link.textColor}` : '',
        link.fontSize ? `font-size: ${link.fontSize}px` : ''
      ].filter(Boolean).join('; ');
      if (styleStr) a.style.cssText = styleStr;

      if (link.icon && link.icon.trim().length > 0) {
        const icon = link.icon.trim();
        if (icon.includes('.') || icon.includes('/')) {
          const src = icon.includes('/') ? icon : `resources/icons/${icon}`;
          a.innerHTML = `<img src="${src}" alt="" class="link-icon-img"> ${link.nome}`;
        } else if (icon.startsWith('fa')) {

          const iconStyle = link.iconColor ? ` style="color:${link.iconColor}${link.fontSize ? `;font-size:${link.fontSize}px` : ''}"` : 
                           (link.fontSize ? ` style="font-size:${link.fontSize}px"` : '');
          a.innerHTML = `<i class="link-icon ${icon}"${iconStyle}></i> ${link.nome}`;
        } else {
          a.innerHTML = createIconHTML(icon).replace('<i class="', '<i class="link-icon ') + ` ${link.nome}`;
        }
      } else {
        a.textContent = link.nome;
      }
      return a;
    };

    const domCache = {
      profile: document.getElementById('profile'),
      name: document.getElementById('name'),
      description: document.getElementById('description'),
      redesContainer: document.getElementById('redes'),
      pastasContainer: document.getElementById('pastas')
    };

    // Efeito de inclinação 3D estilo cartas da Steam no perfil
    const initProfileTilt = () => {
      const profile = domCache.profile;
      if (!profile) return;

      profile.addEventListener('mousemove', (e) => {
        const rect = profile.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = -(y - centerY) / (rect.height / 30);
        const rotateY = (x - centerX) / (rect.width / 30);

        profile.style.transform = `perspective(200px) scale(1.1) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      profile.addEventListener('mouseleave', () => {
        profile.style.transform = '';
      });
    };

    initProfileTilt();

    let viewsInterval = null;
    let viewsProgressInterval = null;
    let currentProfileName = null;

    const startViewsTimer = () => {
      if (viewsInterval) clearInterval(viewsInterval);
      if (viewsProgressInterval) clearInterval(viewsProgressInterval);

      const duration = 10 * 60 * 1000; // 10 minutes in ms

      viewsInterval = setInterval(() => {
        updateView();
      }, duration);
    };

    const updateView = () => {
      const name = domCache.name.innerText;
      if (!name) return;

      fetch("https://long-art-5a03.joaorouba1010.workers.dev/api/view/" + name)
        .then(res => res.json())
        .then(data => {
          const viewsEl = document.getElementById("views");
          if (viewsEl) {
            viewsEl.innerText = data['views'] || 0;
          }
          

          const countersEl = document.getElementById("counters");
          if (countersEl) {
            countersEl.classList.remove("pulse-update");
            void countersEl.offsetWidth;
            countersEl.classList.add("pulse-update");
          }
        })
        .catch(err => {
          console.error('Erro ao carregar views:', err);
        });


      if (currentProfileName !== name) {
        currentProfileName = name;
        startViewsTimer();
      }
    };

    /* ============================================================
     MIGRAÇÃO RETROCOMPATÍVEL — Converte formato antigo para novo
     Formato antigo: { pastas[], links[] }
     Formato novo:   { items[] com type:"folder"|"link" }
     ============================================================ */
    function migrateDataFormat(data) {
      if (data.items && Array.isArray(data.items)) {
        return data;
      }

      if (data.pastas || data.links) {
        console.log("🔄 Migrando dados do formato antigo para o novo...");

        const migratedData = { ...data };
        migratedData.items = [];

        if (data.pastas && Array.isArray(data.pastas)) {
          data.pastas.forEach(pasta => {
            const migratedPasta = {
              id: pasta.id || generateId(),
              type: "folder",
              nome: pasta.nome || "",
              topic: pasta.topic || "",
              icon: pasta.icon || pasta.Icon || "", // Suporte para Icon antigo
              iconColor: pasta.iconColor || "",
              textColor: pasta.textColor || "",
              fontSize: pasta.fontSize || "",
              links: pasta.links || []
            };
            migratedData.items.push(migratedPasta);
          });
        }

        if (data.links && Array.isArray(data.links)) {
          data.links.forEach(link => {
            const migratedLink = {
              id: link.id || generateId(),
              type: "link",
              nome: link.nome || "",
              topic: link.topic || "",
              url: link.url || "",
              icon: link.icon || "",
              iconColor: link.iconColor || "",
              textColor: link.textColor || "",
              fontSize: link.fontSize || ""
            };
            migratedData.items.push(migratedLink);
          });
        }

        delete migratedData.pastas;
        delete migratedData.links;

        console.log("✅ Migração concluída! Dados convertidos para o novo formato.");
        return migratedData;
      }

      return data;
    }

    function renderProfile(data) {
      if (!data) return;

      domCache.redesContainer.innerHTML = "";
      domCache.pastasContainer.innerHTML = "";

      if (data.profile) {
        domCache.profile.src = data.profile;
        domCache.profile.style.display = "block";
      } else {
        domCache.profile.style.display = "none";
      }

      domCache.name.innerText = data.name || "";
      domCache.description.innerText = data.description || "";

      if (data.background) {
        document.body.style.backgroundImage = `url(${data.background})`;
      } else {
        document.body.style.backgroundImage = 'none';
      }

      data.theme = data.theme || 'dark';
      document.body.classList.remove('dark-theme', 'light-theme');
      document.body.classList.add(data.theme + '-theme');
      if (themeToggle) {
        themeToggle.innerHTML = data.theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      }

      const redesFragment = document.createDocumentFragment();
      (data.redes || []).forEach(r => {
        const a = document.createElement('a');
        a.href = r.url;
        a.target = "_blank";
        a.innerHTML = `<i class="${r.icon}"></i>`;
        redesFragment.appendChild(a);
      });
      domCache.redesContainer.appendChild(redesFragment);

      data = migrateDataFormat(data);

      let items = data.items || [];
      const topics = {};
      const topicLinks = {};

      items.forEach(item => {
        const topic = item.topic || '';
        const isFolder = item.type === 'folder';
        const targetMap = isFolder ? topics : topicLinks;
        if (!targetMap[topic]) targetMap[topic] = [];
        targetMap[topic].push(item);
      });

      const allTopics = new Set([...Object.keys(topics), ...Object.keys(topicLinks)]);
      const containerFragment = document.createDocumentFragment();

      for (const topic of allTopics) {
        const topicDiv = document.createElement('div');
        topicDiv.classList.add('topic');
        const topicTitle = document.createElement('h2');
        topicTitle.innerText = topic;
        topicDiv.appendChild(topicTitle);

        if (topicLinks[topic] && topicLinks[topic].length) {
          const directLinksDiv = document.createElement('div');
          directLinksDiv.classList.add('topic-links');
          topicLinks[topic].forEach(link => {
            directLinksDiv.appendChild(createLinkElement(link, 'topic-link'));
          });
          topicDiv.appendChild(directLinksDiv);
        }

        if (topics[topic] && topics[topic].length) {
          const foldersDiv = document.createElement('div');
          foldersDiv.classList.add('topic-folders');
          topics[topic].forEach(p => {
            const folderItem = document.createElement('div');
            folderItem.classList.add('folder-item');

            const folderToggle = document.createElement('button');
            folderToggle.type = 'button';
            folderToggle.classList.add('folder-toggle');
            
            const folderStyles = [];
            if (p.textColor) folderStyles.push(`color: ${p.textColor}`);
            if (p.fontSize) folderStyles.push(`font-size: ${p.fontSize}px`);
            
            let folderIconHTML = '';
            const folderIcon = (p.Icon || p.icon || '').trim();
            if (folderIcon) {
              if (folderIcon.includes('.') || folderIcon.includes('/')) {
                const src = folderIcon.includes('/') ? folderIcon : `resources/icons/${folderIcon}`;
                folderIconHTML = `<img src="${src}" alt="${p.nome}" class="folder-icon">`;
              } else if (folderIcon.startsWith('fa')) {
                const iconStyle = [];
                if (p.iconColor) iconStyle.push(`color: ${p.iconColor}`);
                const iconStyleStr = iconStyle.length ? ` style="${iconStyle.join('; ')}"` : '';
                folderIconHTML = `<i class="${folderIcon} folder-icon"${iconStyleStr}></i>`;
              }
            }
            
            const styleAttr = folderStyles.length ? ` style="${folderStyles.join('; ')}"` : '';
            folderToggle.innerHTML = `
              <span${styleAttr}>${folderIconHTML} ${p.nome}</span>
              <i class="fas fa-chevron-down folder-arrow"></i>
            `;
            folderItem.appendChild(folderToggle);

            if (p.links && p.links.length) {
              const linksWrapper = document.createElement('div');
              linksWrapper.classList.add('folder-links');

              p.links.forEach(link => {
                linksWrapper.appendChild(createLinkElement(link, 'folder-link'));
              });

              folderToggle.addEventListener('click', () => {
                const isOpen = linksWrapper.classList.contains('is-open');
                if (isOpen) {
                  linksWrapper.classList.remove('is-open');
                  folderToggle.classList.remove('is-open');
                } else {
                  linksWrapper.classList.add('is-open');
                  folderToggle.classList.add('is-open');
                }
              });

              folderItem.appendChild(linksWrapper);
            } else {
              const a = createLinkElement({
                nome: p.nome,
                url: p.link || '#',
                icon: p.Icon || p.icon,
                iconColor: p.iconColor,
                textColor: p.textColor,
                fontSize: p.fontSize
              }, 'folder-link');
              folderItem.appendChild(a);
              folderToggle.replaceWith(a);
            }

            foldersDiv.appendChild(folderItem);
          });
          topicDiv.appendChild(foldersDiv);
        }

        containerFragment.appendChild(topicDiv);
      }

      domCache.pastasContainer.appendChild(containerFragment);
      updateView();
    }

    window.renderProfile = renderProfile;

    if (window.self !== window.top) {
      if (themeToggle) themeToggle.style.display = 'none';
    } else {
      fetch('./resources/data.json')
        .then(res => res.json())
        .then(data => {
          renderProfile(data);
        })
        .catch(err => {
          console.error('Erro ao carregar data.json:', err);
        });
    }