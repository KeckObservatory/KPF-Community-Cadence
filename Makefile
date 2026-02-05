SYSNAM   = kpf-cc
# Is this an official or sandbox build?
ifeq ($(findstring sandbox, $(CURDIR)),sandbox)
	VERNUM  = ""
	RELDIR  = $(subst build,,$(CURDIR))
else
	VERNUM = $(shell basename `pwd`)
	RELDIR = /www/observers/$(SYSNAM)/$(VERNUM)
endif

EXCLUDE  = --exclude .git --exclude README --exclude Makefile

install:
	@echo "rsync -abvhHS --recursive ./ /$(RELDIR)/ $(EXCLUDE)"
	rsync -abvhHS --recursive ./ /$(RELDIR)/ $(EXCLUDE)
	@if [ "$(VERNUM)" != "" ]; then \
		echo "cd $(RELDIR)/..; rm rel; ln -s $(VERNUM) rel;"; \
		cd $(RELDIR)/..; \
		rm rel; \
		ln -s $(VERNUM) rel; \
	fi

show:
	@echo CURDIR = $(CURDIR)
	@echo SYSNAM = $(SYSNAM)
	@echo VERNUM = $(VERNUM)
	@echo RELDIR = $(RELDIR)
