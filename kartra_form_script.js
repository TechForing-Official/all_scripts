window.kartra_form_script =
    function Kartra_form_script() {
        let country = 'us';
        let countryData;
        let allCountries = [];

        // Clear stored form values if they exist
        if (localStorage.hasOwnProperty('b24-form-field-stored-values')) {
            localStorage.removeItem('b24-form-field-stored-values');
        }

        function cleanFlagUrl(url) {
            if (!url) return '';
            const mediaFlagIndex = url.lastIndexOf('media/flag');
            if (mediaFlagIndex !== -1) {
                return 'https://cmsfilestf.s3.amazonaws.com/' + url.substring(mediaFlagIndex);
            }
            return url;
        }

        function findCountryByDialCode(dialCode) {
            const cleanDialCode = dialCode.replace(/\D/g, '');
            return allCountries.find(country => {
                const countryDialCode = country.phone.replace(/\D/g, '');
                return cleanDialCode === countryDialCode;
            });
        }

        function createCountrySelector(currentCountry, elem) {
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

            function renderCountries(searchTerm = '') {
                countryList.innerHTML = '';
                if (allCountries.length === 0) {
                    const loadingMessage = document.createElement('div');
                    loadingMessage.classList.add('country-option2');
                    loadingMessage.textContent = 'Loading countries...';
                    countryList.appendChild(loadingMessage);
                    return;
                }

                const filteredCountries = allCountries.filter(country =>
                    country.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    country.phone.includes(searchTerm)
                );

                if (filteredCountries.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.classList.add('country-option2');
                    noResults.textContent = 'No countries found';
                    countryList.appendChild(noResults);
                    return;
                }

                filteredCountries.forEach(country => {
                    const countryOption = document.createElement('div');
                    countryOption.classList.add('country-option2');
                    if (country.ISO_alpha === currentCountry?.ISO_alpha) {
                        countryOption.classList.add('selected');
                    }

                    countryOption.innerHTML = `
                        <img src="${cleanFlagUrl(country.flag)}" alt="${country.countryName}" class="country-option-flag2">
                        <span class="country-name2">${country.countryName.replace(/-/g, ' ')}</span>
                        <span class="country-code2">${country.phone}</span>
                    `;

                    countryOption.addEventListener('click', async () => {
                        countryData = country;
                        updateInputWithCountry(country, elem);
                        dropdown.style.display = 'none';
                        document.querySelectorAll('.country-option2').forEach(opt => opt.classList.remove('selected'));
                        countryOption.classList.add('selected');
                    });

                    countryList.appendChild(countryOption);
                });
            }

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
        }

        function updateInputWithCountry(country, elem) {
            const wrapper = elem.closest('.phone-input-wrapper2');
            const flagImg = wrapper.querySelector('.country-flag2');
            flagImg.src = cleanFlagUrl(country.flag);

            const phoneCode = country.phone.startsWith('+') ? country.phone : `+${country.phone}`;
            elem.value = phoneCode;

            const event = new Event('input', { bubbles: true });
            elem.dispatchEvent(event);
        }

        function handleDialCodeChange(input, flagElement) {
            const value = input.value;
            const dialCodeMatch = value.match(/^\+\d+/);

            if (dialCodeMatch) {
                const dialCode = dialCodeMatch[0];
                const matchingCountry = findCountryByDialCode(dialCode);

                if (matchingCountry) {
                    countryData = matchingCountry;
                    flagElement.src = cleanFlagUrl(matchingCountry.flag);
                    const dropdown = input.parentElement.querySelector('.country-selector-dropdown2');
                    if (dropdown) {
                        const options = dropdown.querySelectorAll('.country-option2');
                        options.forEach(opt => {
                            const optionDialCode = opt.querySelector('.country-code2').textContent;
                            if (optionDialCode === matchingCountry.phone) {
                                opt.classList.add('selected2');
                            } else {
                                opt.classList.remove('selected2');
                            }
                        });
                    }
                }
            }
        }

        function initializeInput(elem, countryData) {
            if (!countryData || elem.dataset.initialized) return;

            const wrapper = document.createElement('div');
            wrapper.classList.add('phone-input-wrapper2');
            elem.parentNode.insertBefore(wrapper, elem);
            wrapper.appendChild(elem);

            const flagElement = document.createElement('img');
            flagElement.classList.add('country-flag2');
            flagElement.src = cleanFlagUrl(countryData.flag);
            wrapper.insertBefore(flagElement, elem);

            const dropdown = createCountrySelector(countryData, elem);
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
                elem.value = countryData.phone.startsWith('+') ? countryData.phone : `+${countryData.phone}`;
            }

            elem.dataset.initialized = 'true';

            elem.addEventListener('input', (e) => {
                handleDialCodeChange(elem, flagElement);
                if (!elem.value.startsWith('+')) {
                    elem.value = '+' + elem.value.replace(/\D/g, '');
                }
                const cleaned = '+' + elem.value.substring(1).replace(/\D/g, '');
                if (cleaned !== elem.value) {
                    elem.value = cleaned;
                }
            });
        }

        function initializeAllInputs(countryData) {
            if (!countryData) return;
            document.querySelectorAll("input[type='tel']").forEach(elem => {
                initializeInput(elem, countryData);
            });
        }

        async function initializeCountryData(retryCount = 3) {
            try {
                const res = await fetch('https://cmsadmin.techforing.com/api/v1/blog/country/list/');
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();

                if (Array.isArray(data) && data.length > 0) {
                    allCountries = data;
                    const defaultCountry = data[0]?.default_iso_alpha?.toUpperCase() || 'US';
                    countryData = allCountries.find(c => c.ISO_alpha === defaultCountry) || allCountries[0];
                    initializeAllInputs(countryData);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error fetching country data:', error);
                if (retryCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return initializeCountryData(retryCount - 1);
                }
                return false;
            }
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'INPUT' && node.type === 'tel') {
                        initializeInput(node, countryData);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll("input[type='tel']").forEach(elem => {
                            initializeInput(elem, countryData);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const styles = `

            html {
            scroll-behavior: smooth;
            }

            .b24-form-field-phone .b24-form-control-label {
            top: 10px !important;
            font-size: 14px !important;
            }

            input[type='tel'] {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
                }


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
                max-height: 300px;
                width: 300px;
            }
            
            .country-search2 {
                width: calc(100% - 16px);
                margin: 8px;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
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
            }
            
            .country-code2 {
                color: #666;
                font-size: 14px;
            }
            
            .country-list2::-webkit-scrollbar {
                width: 8px;
            }
            
            .country-list2::-webkit-scrollbar-track {
                background: #f1f1f1;
            }
            
            .country-list2::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
            }
            
            .country-list2::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;

        // Initialize immediately when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
            initializeCountryData();
        });

        // Also initialize if the script loads after DOMContentLoaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initializeCountryData();
        }
    }
