window.CountryPhoneSelector = {
    countryData: null,
    allCountries: [],

    async initialize(options = {}) {
        const {
            apiUrl = 'https://cmsadmin.techforing.com/api/v1/blog/country/list/',
            defaultCountry = 'US',
            retryCount = 3
        } = options;

        // Add styles to document
        this.addStyles();

        // Initialize country data
        await this.initializeCountryData(apiUrl, retryCount);

        // Set up mutation observer
        this.setupMutationObserver();

        // Initialize all existing phone inputs
        this.initializeAllInputs();
    },

    addStyles() {
        const styles = `
        .phone-input-wrapper2 {
            position: relative;
            display: inline-flex;
            align-items: center;
            width: 100%;
        }
        
        .phone-input-wrapper2 input[type='tel'] {
            padding-left: 40px;
            width: 100%;
        }
        
        .country-flag2 {
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 24px;
            height: 16px;
            cursor: pointer;
            border: 1px solid #ddd;
            border-radius: 2px;
            z-index: 1;
            object-fit: cover;
        }
        
        .country-selector-dropdown2 {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 15;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-height: 274px;
            width: 270px;
            overflow: hidden;
        }
        
        .country-search2 {
            width: calc(100% - 16px) !important;
            margin: 8px;
            padding: 8px;
            border: 1px solid #ddd !important;
            border-radius: 4px;
            font-size: 14px;
            color: black !important;
        }
        input.country-search2::placeholder {
             color: black !important;
             font-size: 16px;
            padding-left: 10px;
             height: 42px;
        }
        
        input.country-search2:focus {
            box-shadow: none !important;
        }
        .country-list2 {
            max-height: 250px;
            overflow-y: auto;
        }
        
        .country-option2 {
            display: flex;
            align-items: center;
            padding: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .country-option2:hover {
            background-color: #f5f5f5;
        }
        
        .country-option2.selected {
            background-color: #e8f0fe;
        }
        
        .country-option-flag2 {
            width: 24px;
            height: 16px;
            margin-right: 8px;
            border: 1px solid #ddd;
            border-radius: 2px;
            object-fit: cover;
        }
        
        .country-name2 {
            flex: 1;
            margin-right: 8px;
            font-size: 14px;
            color:black;
            display: inline;
        }
        
        .country-code2 {
            color: #666;
            font-size: 14px;
            color: black;
            display: inline;
        }`;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    },

    cleanFlagUrl(url) {
        if (!url) return '';
        const mediaFlagIndex = url.lastIndexOf('media/flag');
        if (mediaFlagIndex !== -1) {
            return 'https://cmsfilestf.s3.amazonaws.com/' + url.substring(mediaFlagIndex);
        }
        return url;
    },

    findCountryByDialCode(dialCode) {
        const cleanDialCode = dialCode.replace(/\D/g, '');
        return this.allCountries.find(country => {
            const countryDialCode = country.phone.replace(/\D/g, '');
            return cleanDialCode === countryDialCode;
        });
    },

    createCountrySelector(currentCountry, elem) {
        const dropdown = document.createElement('div');
        dropdown.classList.add('country-selector-dropdown2');
        dropdown.style.display = 'none';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search countries...';
        searchInput.classList.add('country-search2');
        dropdown.appendChild(searchInput);

        const countryList = document.createElement('div');
        countryList.classList.add('country-list2');

        const renderCountries = (searchTerm = '') => {
            countryList.innerHTML = '';
            if (this.allCountries.length === 0) {
                const loadingMessage = document.createElement('div');
                loadingMessage.classList.add('country-option2');
                loadingMessage.textContent = 'Loading countries...';
                countryList.appendChild(loadingMessage);
                return;
            }

            const filteredCountries = this.allCountries.filter(country =>
                country.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                country.phone.includes(searchTerm)
            );

            filteredCountries.forEach(country => {
                const countryOption = document.createElement('div');
                countryOption.classList.add('country-option2');
                if (country.ISO_alpha === currentCountry?.ISO_alpha) {
                    countryOption.classList.add('selected');
                }

                countryOption.innerHTML = `
                <img src="${this.cleanFlagUrl(country.flag)}" alt="${country.countryName}" class="country-option-flag2">
                <p class="country-name2">${country.countryName}</p>
                <p class="country-code2">${country.phone}</p>
            `;

                countryOption.addEventListener('click', () => {
                    this.countryData = country;
                    this.updateInputWithCountry(country, elem);
                    dropdown.style.display = 'none';
                    document.querySelectorAll('.country-option2').forEach(opt => opt.classList.remove('selected'));
                    countryOption.classList.add('selected');
                });

                countryList.appendChild(countryOption);
            });
        };

        searchInput.addEventListener('input', (e) => {
            renderCountries(e.target.value);
        });

        dropdown.appendChild(countryList);
        renderCountries();

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !e.target.classList.contains('country-flag2')) {
                dropdown.style.display = 'none';
            }
        });

        return dropdown;
    },

    updateInputWithCountry(country, elem) {
        const wrapper = elem.closest('.phone-input-wrapper2');
        const flagImg = wrapper.querySelector('.country-flag2');
        flagImg.src = this.cleanFlagUrl(country.flag);

        const phoneCode = country.phone.startsWith('+') ? country.phone : `+${country.phone}`;
        elem.value = phoneCode;

        const event = new Event('input', { bubbles: true });
        elem.dispatchEvent(event);
    },

    handleDialCodeChange(input, flagElement) {
        const value = input.value;
        const dialCodeMatch = value.match(/^\+\d+/);

        if (dialCodeMatch) {
            const dialCode = dialCodeMatch[0];
            const matchingCountry = this.findCountryByDialCode(dialCode);

            if (matchingCountry) {
                this.countryData = matchingCountry;
                flagElement.src = this.cleanFlagUrl(matchingCountry.flag);
            }
        }
    },

    initializeInput(elem) {
        if (!this.countryData || elem.dataset.initialized) return;

        const wrapper = document.createElement('div');
        wrapper.classList.add('phone-input-wrapper2');
        elem.parentNode.insertBefore(wrapper, elem);
        wrapper.appendChild(elem);

        const flagElement = document.createElement('img');
        flagElement.classList.add('country-flag2');
        flagElement.src = this.cleanFlagUrl(this.countryData.flag);
        wrapper.insertBefore(flagElement, elem);

        const dropdown = this.createCountrySelector(this.countryData, elem);
        wrapper.appendChild(dropdown);

        flagElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const allDropdowns = document.querySelectorAll('.country-selector-dropdown2');
            allDropdowns.forEach(d => {
                if (d !== dropdown) d.style.display = 'none';
            });
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        if (!elem.value) {
            elem.value = this.countryData.phone.startsWith('+') ? this.countryData.phone : `+${this.countryData.phone}`;
        }

        elem.dataset.initialized = 'true';

        elem.addEventListener('input', (e) => {
            this.handleDialCodeChange(elem, flagElement);
            if (!elem.value.startsWith('+')) {
                elem.value = '+' + elem.value.replace(/\D/g, '');
            }
            const cleaned = '+' + elem.value.substring(1).replace(/\D/g, '');
            if (cleaned !== elem.value) {
                elem.value = cleaned;
            }
        });
    },

    initializeAllInputs() {
        document.querySelectorAll("input[type='tel']").forEach(elem => {
            this.initializeInput(elem);
        });
    },

    async initializeCountryData(apiUrl, retryCount = 3) {
        try {
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                this.allCountries = data;
                const defaultCountry = data[0]?.default_iso_alpha?.toUpperCase() || 'US';
                this.countryData = this.allCountries.find(c => c.ISO_alpha === defaultCountry) || this.allCountries[0];
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error fetching country data:', error);
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.initializeCountryData(apiUrl, retryCount - 1);
            }
            return false;
        }
    },

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'INPUT' && node.type === 'tel') {
                        this.initializeInput(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll("input[type='tel']").forEach(elem => {
                            this.initializeInput(elem);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
};