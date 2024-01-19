const perPage = 5; // Number of repositories per page
let currentPage = 1;
let repoUrl;
const accessToken = process.env.accessToken;


// Modify your fetchProfile function
async function fetchProfile() {
    const username = document.getElementById('searchInput').value;
    const userInfoContainer = document.getElementById('userInfo');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');


    // Reset previous state
    userInfoContainer.innerHTML = '';
    errorMessage.innerHTML = '';
    loadingIndicator.style.display = 'block';

    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Rest of your code to handle the response...

        if (!response.ok) {
            throw new Error('User not found');
        }

        const userData = await response.json();
        console.log('userInfo', userData);

        // Display user information
        userInfoContainer.innerHTML = `
         <div>
        <img src="${userData.avatar_url}" alt="${userData.login}'s Avatar">
        <h2>${userData.name || userData.login}</h2>
        <p class="lead">${userData.bio || 'No bio available'}</p>
      </div>
      <div class="info-section">
        <p><strong>Followers:</strong> ${userData.followers}</p>
        <p><strong>Following:</strong> ${userData.following}</p>
        <p><strong>Public Repositories:</strong> ${userData.public_repos}</p>
        <p><strong>Location:</strong> ${userData.location || 'Not specified'}</p>
        <p><strong>Member since:</strong> ${new Date(userData.created_at).toLocaleDateString()}</p>
      </div>
      <div class="view-on-github">
        <a href="${userData.html_url}" class="btn" target="_blank">View on GitHub</a>
      </div>
      `;
        userInfoContainer.classList.add('user-profile-container');
        // Fetch repositories with pagination
        repoUrl = userData.repos_url
        await fetchAndDisplayRepositories();



        // chart 
        const reposData = await fetch(`${repoUrl}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const languagData = await reposData.json()
        // Extract languages from repositories
        const languages = languagData.map(repo => repo.language);

        // Remove null and undefined values
        const filteredLanguages = languages.filter(language => language);

        // Count language occurrences
        const languageCounts = filteredLanguages.reduce((acc, language) => {
            acc[language] = (acc[language] || 0) + 1;
            return acc;
        }, {});

        // Display language distribution chart
        displayLanguageChart(languageCounts);


    } catch (error) {
        // Handle errors
        errorMessage.innerHTML = `Error: ${error.message}`;
    } finally {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
    }
}

// New function to fetch and display repositories with pagination
async function fetchAndDisplayRepositories() {
    try {
        const reposResponse = await fetch(`${repoUrl}?per_page=${10}&page=${currentPage}`);
        const reposData = await reposResponse.json();
        console.log("Repositories", reposData);
        console.log(`${repoUrl}?per_page=${10}&page=${currentPage}`);
        // Display repositories
        displayRepositories(reposData);

        // Update pagination controls
        const linkHeader = reposResponse.headers.get('Link');
        const totalPages = extractTotalPages(linkHeader);
        updatePagination(totalPages);

    } catch (error) {
        console.error('Error fetching repositories:', error);
    }
}


function updatePagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = i;
        a.addEventListener('click', () => changePage(i));
        li.appendChild(a);
        paginationContainer.appendChild(li);
    }
}

function changePage(page) {
    currentPage = page;
    console.log("change page called ", page);
    fetchAndDisplayRepositories();
}

async function loadAndDisplayRepositories(page) {
    const repositories = await fetchAndDisplayRepositories(page);
    displayRepositories(repositories);
    const linkHeader = repositories.headers.get('Link');
    const totalPages = extractTotalPages(linkHeader);
    updatePagination(totalPages);
}


// Function to display repositories
function displayRepositories(reposData) {
    const repositoriesList = document.getElementById('repositoriesList');

    // Clear previous repositories
    repositoriesList.innerHTML = '';

    reposData.forEach(repo => {
        const repoItem = document.createElement('li');
        const languages = Array.isArray(repo.language) ? repo.language : [repo.language];

        repoItem.innerHTML = `
            <strong class="repo-title">${repo.name}</strong> 
            <div>
                <p> Star Count: ${repo.stargazers_count} | Last Updated: ${new Date(repo.pushed_at).toLocaleDateString()}</p>
                <p>Languages: ${createLanguageTags(languages)}</p>
            </div>
            <a target="_blank" href=${repo.clone_url}>
            <button ">View Details</button>
            </a>
        `;

        repoItem.dataset.name = repo.name;
        repoItem.dataset.stargazers_count = repo.stargazers_count;
        repoItem.dataset.pushed_at = repo.pushed_at;
        repoItem.dataset.languages = JSON.stringify(languages);

        repositoriesList.appendChild(repoItem);
    });

    // Initial sorting
    sortRepositories();
}

function createLanguageTags(languages) {
    if (languages.length === 0) {
        return `<span class="language-tag">Not specified</span>`;
    }

    return languages.map(language => `<span class="language-tag">${language}</span>`).join(' ');
}

function extractTotalPages(linkHeader) {
    const links = {};

    if (linkHeader) {
        linkHeader.split(',').forEach(part => {
            const match = part.match(/<([^>]+)>; rel="([^"]+)"/);
            if (match) {
                links[match[2]] = match[1];
            }
        });
    }

    return links.last ? parseInt(links.last.split('page=')[1]) : 1;
}


loadAndDisplayRepositories(currentPage);





// extraasssssssssss-----------------------------------



// Function to display the language distribution chart
function displayLanguageChart(languageCounts) {
    const chartContainer = document.getElementById('chartContainer');

    // Create a pie chart
    const ctx = document.createElement('canvas').getContext('2d');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(ctx.canvas);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(languageCounts),
            datasets: [{
                data: Object.values(languageCounts),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                ],
            }],
        },
    });
}



// Function to sort repositories
function sortRepositories() {
    const sortCriteria = document.getElementById('sortCriteria').value;
    const repositoriesList = document.getElementById('repositoriesList');
    const repositories = Array.from(repositoriesList.children);

    repositories.sort((a, b) => {
        const aValue = a.dataset[sortCriteria];
        const bValue = b.dataset[sortCriteria];

        if (sortCriteria === 'pushed_at') {
            return new Date(bValue) - new Date(aValue);
        }

        return bValue - aValue;
    });

    repositories.forEach(repo => repositoriesList.appendChild(repo));
}

// Function to filter repositories by language
function filterRepositories() {
    const filterLanguage = document.getElementById('filterLanguage').value.toLowerCase();
    const repositoriesList = document.getElementById('repositoriesList');
    const repositories = Array.from(repositoriesList.children);

    repositories.forEach(repo => {
        const repoLanguage = repo.dataset.language.toLowerCase();
        if (repoLanguage.includes(filterLanguage)) {
            repo.style.display = 'block';
        } else {
            repo.style.display = 'none';
        }
    });
}



// Function to calculate the longest streak of consecutive days with contributions
function calculateLongestStreak(contributionsData) {
    let currentStreak = 0;
    let longestStreak = 0;

    contributionsData.forEach(contribution => {
        if (contribution.count > 0) {
            currentStreak++;
        } else {
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
            currentStreak = 0;
        }
    });

    // Check the last streak in case it extends to the end
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }

    return longestStreak;
}

// Function to calculate the most used programming language
function calculateMostUsedLanguage(reposData) {
    const languageCounts = reposData.reduce((acc, repo) => {
        const language = repo.language || 'Not specified';
        acc[language] = (acc[language] || 0) + 1;
        return acc;
    }, {});

    const mostUsedLanguage = Object.keys(languageCounts).reduce((a, b) => languageCounts[a] > languageCounts[b] ? a : b, '');

    return mostUsedLanguage;
}


