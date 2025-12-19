import React, { useState, useEffect } from 'react';
import './index.css';
import { getVisitTime, copyTextToClipboard } from './utils';
import { createBookmark, getFavIcon } from './utils/browser';
import { dedupe, sortBy } from './utils/array';

function App() {
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState(() => {
    const savedOptions = localStorage.getItem('options');
    return savedOptions ? JSON.parse(savedOptions) : {
      format: 'all',
      mode: 'list',
      groupBy: 'domain',
      sortBy: 'date',
      relativeTime: true,
    };
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    if (window.chrome && window.chrome.history) {
      const query = {
        text: 'chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html',
        startTime: 0,
        maxResults: 10000,
      };

      window.chrome.history.search(query, (results) => {
        const processedItems = dedupe(results).map(item => {
          item.url = item.url.replace(/\/www\./, '/');
          const model = new URL(item.url);
          const params = new URLSearchParams(model.hash.substr(1));
          const time = item.lastVisitTime;
          const title = params.get('ttl') || item.title;
          const url = params.get('uri') || item.url;
          const dateTime = getVisitTime(time);
          const relativeTime = getVisitTime(time, true);
          const visits = item.visitCount;

          return {
            domain: new URL(url).hostname,
            title,
            url,
            visits,
            visitsText: `${visits} visit${visits !== 1 ? 's' : ''}`,
            dateTime,
            date: dateTime.substring(0, 10),
            relativeTime,
            time: item.lastVisitTime,
          };
        });

        setItems(processedItems);
        setLoaded(true);
      });
    } else {
      console.log('Not running as a Chrome extension, using mock data');
      const mockData = [
        {
          id: '1',
          url: 'https://www.example.com',
          title: 'Example Domain',
          lastVisitTime: new Date().getTime(),
          visitCount: 5,
        },
        {
          id: '2',
          url: 'https://www.google.com',
          title: 'Google',
          lastVisitTime: new Date().getTime() - 86400000, // 1 day ago
          visitCount: 10,
        },
      ];
      const processedItems = mockData.map(item => {
        const time = item.lastVisitTime;
        const dateTime = getVisitTime(time);
        const relativeTime = getVisitTime(time, true);

        return {
          domain: new URL(item.url).hostname,
          title: item.title,
          url: item.url,
          visits: item.visitCount,
          visitsText: `${item.visitCount} visit${item.visitCount !== 1 ? 's' : ''}`,
          dateTime,
          date: dateTime.substring(0, 10),
          relativeTime,
          time: item.lastVisitTime,
        };
      });
      setItems(processedItems)
      setLoaded(true)
    }
  }, []);

  const handleOptionsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOptions(prevOptions => ({ ...prevOptions, [name]: type === 'checkbox' ? checked : value }));
  };

  const sorted = [...items].sort(sortBy(options.sortBy, ['date', 'visits'].includes(options.sortBy)));

  const grouped = sorted.reduce((acc, item) => {
    const groupTitle = item[options.groupBy];
    if (!acc[groupTitle]) {
      acc[groupTitle] = { title: groupTitle, time: item.time, visits: item.visits, items: [] };
    }
    acc[groupTitle].items.push(item);
    return acc;
  }, {});

  const copyData = () => {
    let data, type;
    if (options.format === 'text') {
      data = sorted.map(item => `${item.title}\n${item.url}`).join('\n\n');
      type = 'text/plain';
    } else {
      data = Object.keys(grouped).map(groupTitle => {
        const group = grouped[groupTitle];
        const items = group.items.map(item => `<li><a href="${item.url}">${item.title}</a></li>`).join('');
        return `<h2>${group.title}</h2>\n<ul>${items}</ul>`;
      }).join('\n');
      type = 'text/html';
    }

    copyTextToClipboard(data, type);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  const bookmarkData = async () => {
    if (window.chrome && window.chrome.bookmarks) {
      const folder = await createBookmark({ title: `Recovered Tabs ${new Date().toLocaleDateString()}` });
      for (const item of sorted) {
        await createBookmark({ parentId: folder.id, title: item.title, url: item.url });
      }
      setMessage('Bookmarks created!');
      setTimeout(() => setMessage(''), 2000);
    } else {
        setMessage('Bookmark functionality is only available in a Chrome extension.');
        setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div id="app" data-format={options.format}>
      <main>
        <h1>The Great Suspender Recovery Tool</h1>
        <div className="options">
          <label>
            View as:
            <select name="mode" value={options.mode} onChange={handleOptionsChange}>
              <option value="list">List</option>
              <option value="table">Table</option>
            </select>
          </label>
          <label>
            Group By:
            <select name="groupBy" value={options.groupBy} onChange={handleOptionsChange} disabled={options.mode === 'table'}>
              <option value="domain">Domain</option>
              <option value="date">Date</option>
            </select>
          </label>
          <label>
            Sort By:
            <select name="sortBy" value={options.sortBy} onChange={handleOptionsChange}>
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="visits">Visits</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="relativeTime" checked={options.relativeTime} onChange={handleOptionsChange} />
            Relative Time
          </label>
          <button onClick={copyData}>Copy URLs</button>
          <button onClick={bookmarkData}>Bookmark All</button>
        </div>

        {message && <div className="message">{message}</div>}

        {loaded ? (
          options.mode === 'list' ? (
            <div>
              {Object.keys(grouped).map(groupTitle => (
                <div key={groupTitle} className="group">
                  <h2>{groupTitle}</h2>
                  <ul>
                    {grouped[groupTitle].items.map((item, index) => (
                      <li key={index}>
                        <img src={getFavIcon(item.url)} alt="" />
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                        <span>{options.relativeTime ? item.relativeTime : item.dateTime}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>URL</th>
                  <th>{options.sortBy === 'visits' ? 'Visits' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item, index) => (
                  <tr key={index}>
                    <td><img src={getFavIcon(item.url)} alt="" /></td>
                    <td>{item.title}</td>
                    <td><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></td>
                    <td>{options.sortBy === 'visits' ? item.visits : (options.relativeTime ? item.relativeTime : item.dateTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </div>
  );
}

export default App;
